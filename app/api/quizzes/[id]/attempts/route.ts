import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
  const answers: Record<string, string> =
    body?.answers && typeof body.answers === "object" ? body.answers : {};

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .eq("quiz_id", id);

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

  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id: id,
    user_id: user.id,
    score,
    total_questions: questions.length,
    answers,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your attempt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, score, total: questions.length });
}
