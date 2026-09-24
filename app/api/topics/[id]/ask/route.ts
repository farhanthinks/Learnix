import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import { describeGroqError } from "@/lib/ai/groq-error";
import { sanitizeAskResponse, tryParseAskResponse } from "@/lib/ai/parse-ask-response";
import { createClient } from "@/lib/supabase/server";

const MODEL = "openai/gpt-oss-120b";
const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = String(body?.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "That question is too long." }, { status: 400 });
  }

  const history = Array.isArray(body?.history)
    ? (body.history as { role: string; content: string }[])
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0,
        )
        .slice(-MAX_HISTORY_TURNS * 2)
    : [];

  const { data: topic } = await supabase
    .from("topics")
    .select("title, slug, unit_title, subtopics, difficulty, subjects(slug)")
    .eq("id", id)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const { data: notes } = await supabase
    .from("topic_notes")
    .select("content")
    .eq("topic_id", id)
    .maybeSingle();

  const systemPrompt = [
    `You are a helpful, contextual AI tutor for exactly one syllabus topic: "${topic.title}"`,
    topic.unit_title ? `(unit: ${topic.unit_title})` : "",
    `Difficulty: ${topic.difficulty}.`,
    topic.subtopics?.length ? `Subtopics: ${topic.subtopics.join(", ")}.` : "",
    notes?.content
      ? `Here are the student's existing study notes for this topic, for context:\n${notes.content.slice(0, 3000)}`
      : "",
    "Answer the student's question about this topic. Keep answers concise, clear, and exam-focused. If asked for an example, give a concrete one. If asked to explain simply or 'like I'm a beginner', avoid jargon. Stay strictly on this topic — if the question is unrelated, gently redirect the student back to it.",
    'Reply with STRICT JSON ONLY — no markdown fences, no commentary before or after: { "answer": "markdown-formatted answer to the question", "references": ["Book Title — Author Name", ...] }',
    '"answer" is Markdown. "references" is 0-3 real, well-known textbooks or academic references relevant to this topic (e.g. "Computer Networks — Andrew S. Tanenbaum"). Only include books you are confident are real and relevant — never invent a title or author; return an empty array if none come to mind confidently.',
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: question },
  ];

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_completion_tokens: 1024,
      reasoning_effort: "low",
      reasoning_format: "hidden",
    });

    let result = sanitizeAskResponse(tryParseAskResponse(completion.choices[0]?.message?.content));

    if (!result) {
      const retryCompletion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.5,
        max_completion_tokens: 1024,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        messages: [
          ...messages,
          { role: "assistant", content: completion.choices[0]?.message?.content ?? "" },
          {
            role: "user",
            content:
              "Your previous response was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no markdown, no explanation.",
          },
        ],
      });
      result = sanitizeAskResponse(
        tryParseAskResponse(retryCompletion.choices[0]?.message?.content),
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: "The AI didn't return an answer. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    const { status, error } = describeGroqError(err, "topic-ask");
    return NextResponse.json({ error }, { status });
  }
}
