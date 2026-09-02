import Groq from "groq-sdk";
import { NextResponse } from "next/server";

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
    .select("title, unit_title, subtopics, difficulty")
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
  ]
    .filter(Boolean)
    .join("\n");

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: question },
      ],
      temperature: 0.5,
      max_completion_tokens: 1024,
      reasoning_effort: "low",
      reasoning_format: "hidden",
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json(
        { error: "The AI didn't return an answer. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json(
      { error: "The AI service is temporarily unavailable. Please try again in a moment." },
      { status: 502 },
    );
  }
}
