import { notFound, redirect } from "next/navigation";

import type { MockTestCardData } from "@/components/quizzes/mock-test-card";
import type { PreviousAttemptData } from "@/components/quizzes/previous-attempts-table";
import { SubjectQuizShell, type QuizUnitGroup } from "@/components/quizzes/subject-quiz-shell";
import type { SubjectTopicQuizRowData } from "@/components/quizzes/subject-topic-quiz-row";
import {
  computeMockQuestionCount,
  computeMockTimeLimitMinutes,
  computePercentage,
} from "@/lib/quizzes/stats";
import { createClient } from "@/lib/supabase/server";
import type { QuizType } from "@/types/database";

const MOCK_TEST_MIN_TOPICS = 3;
const HISTORY_LIMIT = 10;

interface QuizRow {
  id: string;
  topic_id: string | null;
  quiz_type: QuizType;
  title: string;
  time_limit_minutes: number | null;
  question_count: number;
}

interface AttemptRow {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string | null;
  is_completed: boolean;
  time_taken_seconds: number | null;
}

export default async function SubjectQuizzesPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .eq("slug", subjectSlug)
    .single();

  if (!subject) {
    notFound();
  }

  const [{ data: topics }, { data: quizzes }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, title, unit_no, unit_title, difficulty")
      .eq("subject_id", subject.id)
      .order("unit_no", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("quizzes")
      .select("id, topic_id, quiz_type, title, time_limit_minutes, question_count")
      .eq("subject_id", subject.id),
  ]);

  const allTopics = topics ?? [];
  const allQuizzes: QuizRow[] = quizzes ?? [];
  const quizByTopicId = new Map(
    allQuizzes.filter((q) => q.quiz_type === "topic" && q.topic_id).map((q) => [q.topic_id!, q]),
  );
  const mockQuiz = allQuizzes.find((q) => q.quiz_type === "mock") ?? null;

  const quizIds = allQuizzes.map((q) => q.id);
  const { data: attempts } =
    quizIds.length > 0
      ? await supabase
          .from("quiz_attempts")
          .select(
            "id, quiz_id, score, total_questions, completed_at, is_completed, time_taken_seconds",
          )
          .eq("user_id", user.id)
          .in("quiz_id", quizIds)
      : { data: [] as AttemptRow[] };

  const allAttempts: AttemptRow[] = attempts ?? [];
  const attemptsByQuizId = new Map<string, AttemptRow[]>();
  for (const a of allAttempts) {
    const list = attemptsByQuizId.get(a.quiz_id) ?? [];
    list.push(a);
    attemptsByQuizId.set(a.quiz_id, list);
  }

  function bestPercentage(quizId: string | undefined): number | null {
    if (!quizId) return null;
    const completed = (attemptsByQuizId.get(quizId) ?? []).filter((a) => a.is_completed);
    if (completed.length === 0) return null;
    return Math.max(...completed.map((a) => computePercentage(a.score, a.total_questions)));
  }

  function lastAttemptAt(quizId: string | undefined): string | null {
    if (!quizId) return null;
    const completed = (attemptsByQuizId.get(quizId) ?? []).filter(
      (a) => a.is_completed && a.completed_at,
    );
    if (completed.length === 0) return null;
    return completed.reduce(
      (latest, a) => (a.completed_at! > latest ? a.completed_at! : latest),
      completed[0].completed_at!,
    );
  }

  function hasIncomplete(quizId: string | undefined): boolean {
    if (!quizId) return false;
    return (attemptsByQuizId.get(quizId) ?? []).some((a) => !a.is_completed);
  }

  const groupsMap = new Map<string, QuizUnitGroup>();
  for (const t of allTopics) {
    const key = `${t.unit_no ?? "none"}|${t.unit_title ?? ""}`;
    const group = groupsMap.get(key) ?? { unitNo: t.unit_no, unitTitle: t.unit_title, topics: [] };
    const quiz = quizByTopicId.get(t.id);

    const row: SubjectTopicQuizRowData = {
      topicId: t.id,
      topicTitle: t.title,
      difficulty: t.difficulty,
      questionCount: quiz?.question_count ?? null,
      bestPercentage: bestPercentage(quiz?.id),
      lastAttemptAt: lastAttemptAt(quiz?.id),
      hasIncomplete: hasIncomplete(quiz?.id),
    };

    group.topics.push(row);
    groupsMap.set(key, group);
  }
  const groups = Array.from(groupsMap.values()).sort((a, b) => (a.unitNo ?? 0) - (b.unitNo ?? 0));

  const mockTest: MockTestCardData | null =
    allTopics.length >= MOCK_TEST_MIN_TOPICS
      ? (() => {
          const questionCount =
            mockQuiz?.question_count ?? computeMockQuestionCount(allTopics.length);
          const timeLimitMinutes =
            mockQuiz?.time_limit_minutes ?? computeMockTimeLimitMinutes(questionCount);
          return {
            subjectId: subject.id,
            subjectSlug: subject.slug,
            subjectName: subject.name,
            questionCount,
            timeLimitMinutes,
            bestPercentage: bestPercentage(mockQuiz?.id),
            generated: Boolean(mockQuiz),
          };
        })()
      : null;

  function quizTitle(quizId: string): string {
    return allQuizzes.find((q) => q.id === quizId)?.title ?? "Quiz";
  }

  const previousAttempts: PreviousAttemptData[] = allAttempts
    .filter((a) => a.is_completed && a.completed_at)
    .sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1))
    .slice(0, HISTORY_LIMIT)
    .map((a) => ({
      attemptId: a.id,
      quizTitle: quizTitle(a.quiz_id),
      subjectName: subject.name,
      completedAt: a.completed_at!,
      score: a.score,
      totalQuestions: a.total_questions,
      timeTakenSeconds: a.time_taken_seconds,
    }));

  return (
    <SubjectQuizShell
      subjectName={subject.name}
      mockTest={mockTest}
      groups={groups}
      previousAttempts={previousAttempts}
    />
  );
}
