import { redirect } from "next/navigation";

import {
  QuizResultsShell,
  type TopicBreakdownEntry,
} from "@/components/quizzes/quiz-results-shell";
import type { ReviewQuestion } from "@/components/quizzes/review-answers-list";
import { computePercentage } from "@/lib/quizzes/stats";
import { computeRecommendedQuizzes, isWeakTopic, type TopicPerf } from "@/lib/quizzes/recommend";
import { createClient } from "@/lib/supabase/server";

const RECOMMENDED_NEXT_LIMIT = 3;
const RECENTLY_STUDIED_DAYS = 14;

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
    .select("id, quiz_id, score, total_questions, answers, time_taken_seconds, is_completed")
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
    .select("id, title, quiz_type, topic_id, subject_id")
    .eq("id", attempt.quiz_id)
    .single();

  if (!quiz || !quiz.subject_id) {
    redirect("/dashboard/quizzes");
  }

  const [{ data: subject }, { data: questions }, { data: subjectTopics }] = await Promise.all([
    supabase.from("subjects").select("id, slug, name").eq("id", quiz.subject_id).single(),
    supabase
      .from("quiz_questions")
      .select(
        "id, question, question_type, options, correct_answer, explanation, topic_id, order_index",
      )
      .eq("quiz_id", quiz.id)
      .order("order_index", { ascending: true }),
    supabase.from("topics").select("id, slug, title, difficulty").eq("subject_id", quiz.subject_id),
  ]);

  if (!subject || !questions || questions.length === 0) {
    redirect("/dashboard/quizzes");
  }

  const topicById = new Map((subjectTopics ?? []).map((t) => [t.id, t]));
  const answers: Record<string, string> =
    attempt.answers && typeof attempt.answers === "object" && !Array.isArray(attempt.answers)
      ? (attempt.answers as Record<string, string>)
      : {};

  let incorrectCount = 0;
  let skippedCount = 0;
  const reviewQuestions: ReviewQuestion[] = [];
  const breakdownByTopic = new Map<
    string,
    { topicTitle: string; correct: number; total: number }
  >();

  for (const q of questions) {
    const userAnswer = answers[q.id] ?? "";
    const skipped = userAnswer.trim().length === 0;
    const isCorrect = !skipped && normalize(userAnswer) === normalize(q.correct_answer);
    if (skipped) skippedCount++;
    else if (!isCorrect) incorrectCount++;

    reviewQuestions.push({
      id: q.id,
      question: q.question,
      questionType: q.question_type,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      userAnswer,
      isCorrect,
    });

    const topicId = q.topic_id ?? quiz.topic_id;
    if (topicId) {
      const topicTitle = topicById.get(topicId)?.title ?? "General";
      const entry = breakdownByTopic.get(topicId) ?? { topicTitle, correct: 0, total: 0 };
      entry.total += 1;
      if (isCorrect) entry.correct += 1;
      breakdownByTopic.set(topicId, entry);
    }
  }

  const topicBreakdown: TopicBreakdownEntry[] = Array.from(breakdownByTopic.entries()).map(
    ([topicId, entry]) => ({
      topicId,
      topicTitle: entry.topicTitle,
      correct: entry.correct,
      total: entry.total,
      percentage: computePercentage(entry.correct, entry.total),
    }),
  );
  const weakAreas = topicBreakdown.filter((t) => isWeakTopic(t.percentage));

  // --- Recommended next quizzes: other topics in the same subject ---------

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - RECENTLY_STUDIED_DAYS);

  const [{ data: subjectQuizzes }, { data: sessions }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, topic_id, question_count")
      .eq("subject_id", quiz.subject_id)
      .eq("quiz_type", "topic"),
    supabase
      .from("study_sessions")
      .select("topic_id")
      .gte("started_at", recentCutoff.toISOString()),
  ]);

  const quizByTopicId = new Map((subjectQuizzes ?? []).map((q) => [q.topic_id!, q]));
  const recentlyStudiedTopicIds = new Set((sessions ?? []).map((s) => s.topic_id));

  const excludeTopicId = quiz.quiz_type === "topic" ? quiz.topic_id : null;

  let userAttempts: { quiz_id: string; score: number; total_questions: number }[] = [];
  const subjectQuizIds = (subjectQuizzes ?? []).map((q) => q.id);
  if (subjectQuizIds.length > 0) {
    const { data } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, score, total_questions")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .in("quiz_id", subjectQuizIds);
    userAttempts = data ?? [];
  }

  function bestPercentageForQuiz(quizId: string | undefined): number | null {
    if (!quizId) return null;
    const relevant = userAttempts.filter((a) => a.quiz_id === quizId);
    if (relevant.length === 0) return null;
    return Math.max(...relevant.map((a) => computePercentage(a.score, a.total_questions)));
  }

  const topicPerf: TopicPerf[] = (subjectTopics ?? [])
    .filter((t) => t.id !== excludeTopicId)
    .map((t) => {
      const topicQuiz = quizByTopicId.get(t.id);
      return {
        topicId: t.id,
        topicSlug: t.slug,
        topicTitle: t.title,
        subjectName: subject.name,
        subjectSlug: subject.slug,
        difficulty: t.difficulty,
        questionCount: topicQuiz?.question_count ?? null,
        bestPercentage: bestPercentageForQuiz(topicQuiz?.id),
        recentlyStudied: recentlyStudiedTopicIds.has(t.id),
      };
    });

  const recommendedNext = computeRecommendedQuizzes(topicPerf, RECOMMENDED_NEXT_LIMIT);

  return (
    <QuizResultsShell
      attemptId={attempt.id}
      quizTitle={quiz.title}
      subjectName={subject.name}
      score={attempt.score}
      totalQuestions={attempt.total_questions}
      percentage={computePercentage(attempt.score, attempt.total_questions)}
      incorrectCount={incorrectCount}
      skippedCount={skippedCount}
      timeTakenSeconds={attempt.time_taken_seconds}
      topicBreakdown={topicBreakdown}
      weakAreas={weakAreas}
      recommendedNext={recommendedNext}
      reviewQuestions={reviewQuestions}
    />
  );
}
