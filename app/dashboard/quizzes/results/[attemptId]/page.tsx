import { redirect } from "next/navigation";

import { QuizResultsShell } from "@/components/quizzes/quiz-results-shell";
import type { ReviewQuestion } from "@/components/quizzes/review-answers-list";
import { computePercentage } from "@/lib/quizzes/stats";
import { createClient } from "@/lib/supabase/server";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
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
    .select("id, quiz_id, score, total_questions, answers, is_completed")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) {
    redirect("/dashboard/quizzes");
  }
  if (!attempt.is_completed) {
    redirect(`/dashboard/quizzes/take/${attemptId}`);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, subject_id")
    .eq("id", attempt.quiz_id)
    .single();

  if (!quiz || !quiz.subject_id) {
    redirect("/dashboard/quizzes");
  }

  const [{ data: subject }, { data: questions }] = await Promise.all([
    supabase.from("subjects").select("slug, name").eq("id", quiz.subject_id).single(),
    supabase
      .from("quiz_questions")
      .select("id, question, question_type, options, correct_answer, explanation, order_index")
      .eq("quiz_id", quiz.id)
      .order("order_index", { ascending: true }),
  ]);

  if (!subject || !questions || questions.length === 0) {
    redirect("/dashboard/quizzes");
  }

  const answers: Record<string, string> =
    attempt.answers && typeof attempt.answers === "object" && !Array.isArray(attempt.answers)
      ? (attempt.answers as Record<string, string>)
      : {};

  const reviewQuestions: ReviewQuestion[] = questions.map((q) => {
    const userAnswer = answers[q.id] ?? "";
    const isCorrect =
      userAnswer.trim().length > 0 && normalize(userAnswer) === normalize(q.correct_answer);
    return {
      id: q.id,
      question: q.question,
      questionType: q.question_type,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      userAnswer,
      isCorrect,
    };
  });

  return (
    <QuizResultsShell
      attemptId={attempt.id}
      quizTitle={quiz.title}
      subjectName={subject.name}
      subjectSlug={subject.slug}
      score={attempt.score}
      totalQuestions={attempt.total_questions}
      percentage={computePercentage(attempt.score, attempt.total_questions)}
      incorrectCount={attempt.total_questions - attempt.score}
      reviewQuestions={reviewQuestions}
    />
  );
}
