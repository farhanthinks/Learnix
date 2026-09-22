import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import { matchTopics } from "@/lib/assistant/match-topics";
import { createClient } from "@/lib/supabase/server";

const MODEL = "openai/gpt-oss-120b";
const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;
const NOTES_CHAR_LIMIT = 2500;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subjectId = String(body?.subjectId ?? "");
  const question = String(body?.question ?? "").trim();

  if (!subjectId) {
    return NextResponse.json({ error: "Select a subject first." }, { status: 400 });
  }
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

  const [{ data: subject }, { data: topics }] = await Promise.all([
    supabase.from("subjects").select("id, name, exam_date").eq("id", subjectId).single(),
    supabase
      .from("topics")
      .select("id, title, unit_no, unit_title, difficulty")
      .eq("subject_id", subjectId)
      .order("unit_no", { ascending: true }),
  ]);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  }

  const allTopics = topics ?? [];
  const matched = matchTopics(question, allTopics, 2);

  let notesContext = "";
  if (matched.length > 0) {
    const { data: notesRows } = await supabase
      .from("topic_notes")
      .select("topic_id, content")
      .in(
        "topic_id",
        matched.map((t) => t.id),
      );
    const notesByTopicId = new Map((notesRows ?? []).map((n) => [n.topic_id, n.content]));
    notesContext = matched
      .map((t) => {
        const content = notesByTopicId.get(t.id);
        return content ? `### ${t.title}\n${content.slice(0, NOTES_CHAR_LIMIT)}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  const unitsMap = new Map<string, string[]>();
  for (const t of allTopics) {
    const unitLabel = t.unit_title ? `Unit ${t.unit_no ?? "?"}: ${t.unit_title}` : "Topics";
    const list = unitsMap.get(unitLabel) ?? [];
    list.push(t.title);
    unitsMap.set(unitLabel, list);
  }
  const syllabusOutline = Array.from(unitsMap.entries())
    .map(([unit, titles]) => `${unit} — ${titles.join(", ")}`)
    .join("\n");

  const systemPrompt = [
    `You are Learnix's AI study assistant. The student has selected the subject "${subject.name}" and is asking about it.`,
    subject.exam_date ? `Their exam for this subject is on ${subject.exam_date}.` : "",
    syllabusOutline
      ? `Here is this subject's syllabus outline (units and topics):\n${syllabusOutline}`
      : "This subject has no syllabus extracted yet.",
    notesContext
      ? `The student's own saved study notes for the topic(s) most relevant to their question:\n${notesContext}`
      : "",
    `You can: explain concepts, simplify difficult topics, give examples, compare concepts, generate exam-ready answers, summarize topics, create practice questions, and explain step-by-step — whichever the student's question calls for.`,
    `Stay strictly within "${subject.name}" and its syllabus above. If the question is clearly unrelated to this subject (e.g. about a different subject, or nothing academic), do not answer it — politely say it looks unrelated to "${subject.name}" and ask whether they'd like to switch subjects or ask something about "${subject.name}" instead.`,
    `Format answers in Markdown: use headings, bullet points, numbered steps, code blocks, and tables where they genuinely help. Keep answers clear and student-friendly — no unnecessary padding.`,
  ]
    .filter(Boolean)
    .join("\n\n");

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
      max_completion_tokens: 2048,
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
