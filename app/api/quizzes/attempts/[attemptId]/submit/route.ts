import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const answers: Record<string, string> =
    body?.answers && typeof body.answers === "object" ? body.answers : {};
  const flaggedQuestions: string[] = Array.isArray(body?.flaggedQuestions)
    ? body.flaggedQuestions
    : [];
  const timeTakenSeconds =
    typeof body?.timeTakenSeconds === "number"
      ? Math.max(0, Math.round(body.timeTakenSeconds))
      : null;

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found or already submitted." }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .eq("quiz_id", attempt.quiz_id);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  let score = 0;
  for (const q of questions) {
    const userAnswer = String(answers[q.id] ?? "")
      .trim()
      .toLowerCase();
    const correctAnswer = q.correct_answer.trim().toLowerCase();
    if (userAnswer && userAnswer === correctAnswer) score++;
  }

  const { error } = await supabase
    .from("quiz_attempts")
    .update({
      answers,
      flagged_questions: flaggedQuestions,
      score,
      total_questions: questions.length,
      is_completed: true,
      completed_at: new Date().toISOString(),
      current_question_index: questions.length - 1,
      time_taken_seconds: timeTakenSeconds,
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not submit your attempt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, score, total: questions.length });
}
