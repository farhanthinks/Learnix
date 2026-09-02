import { NextResponse } from "next/server";

import { generateQuizWithGroq } from "@/lib/ai/generate-quiz";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("id, subject_id, title, unit_title, subtopics, difficulty")
    .eq("id", id)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const result = await generateQuizWithGroq({
    unitTitle: topic.unit_title ?? "",
    topicTitle: topic.title,
    subtopics: topic.subtopics ?? [],
    difficulty: topic.difficulty,
  });

  if (result.error || !result.questions) {
    return NextResponse.json(
      { error: result.error ?? "Could not generate a quiz." },
      { status: 502 },
    );
  }

  // Regenerating replaces the old quiz. Cascades remove its questions and
  // attempt history — the client warns about this before calling here.
  await supabase.from("quizzes").delete().eq("topic_id", id);

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      topic_id: id,
      subject_id: topic.subject_id,
      quiz_type: "topic",
      title: `${topic.title} Quiz`,
      difficulty: topic.difficulty,
      question_count: result.questions.length,
    })
    .select("id")
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Could not save the generated quiz." }, { status: 500 });
  }

  const rows = result.questions.map((q) => ({ ...q, quiz_id: quiz.id, topic_id: id }));
  const { error: insertError } = await supabase.from("quiz_questions").insert(rows);

  if (insertError) {
    return NextResponse.json({ error: "Could not save the generated quiz." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quizId: quiz.id });
}
