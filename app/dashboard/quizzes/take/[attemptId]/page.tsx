import { redirect } from "next/navigation";

import { QuizTakeShell, type TakeQuestion } from "@/components/quizzes/quiz-take-shell";
import { createClient } from "@/lib/supabase/server";

export default async function QuizTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select(
      "id, quiz_id, answers, started_at, is_completed, current_question_index, flagged_questions",
    )
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) {
    redirect("/dashboard/quizzes");
  }
  if (attempt.is_completed) {
    redirect(`/dashboard/quizzes/results/${attemptId}`);
  }

  const [{ data: quiz }, { data: questions }] = await Promise.all([
    supabase.from("quizzes").select("title, time_limit_minutes").eq("id", attempt.quiz_id).single(),
    supabase
      .from("quiz_questions")
      .select("id, question, question_type, options")
      .eq("quiz_id", attempt.quiz_id)
      .order("order_index", { ascending: true }),
  ]);

  if (!quiz || !questions || questions.length === 0) {
    redirect("/dashboard/quizzes");
  }

  const takeQuestions: TakeQuestion[] = questions.map((q) => ({
    id: q.id,
    question: q.question,
    question_type: q.question_type,
    options: q.options,
  }));

  const initialAnswers: Record<string, string> =
    attempt.answers && typeof attempt.answers === "object" && !Array.isArray(attempt.answers)
      ? (attempt.answers as Record<string, string>)
      : {};
  const initialFlagged: string[] = Array.isArray(attempt.flagged_questions)
    ? (attempt.flagged_questions as string[])
    : [];

  return (
    <QuizTakeShell
      attemptId={attempt.id}
      quizTitle={quiz.title}
      timeLimitMinutes={quiz.time_limit_minutes}
      startedAt={attempt.started_at}
      questions={takeQuestions}
      initialAnswers={initialAnswers}
      initialIndex={attempt.current_question_index}
      initialFlagged={initialFlagged}
    />
  );
}
