import { redirect } from "next/navigation";

import type { ContinuePracticeItem } from "@/components/quizzes/continue-practice-row";
import type { MockTestCardData } from "@/components/quizzes/mock-test-card";
import type { PreviousAttemptData } from "@/components/quizzes/previous-attempts-table";
import { QuizzesShell, type QuizzesSummary } from "@/components/quizzes/quizzes-shell";
import type { SubjectQuizLibraryData } from "@/components/quizzes/subject-quiz-card";
import type { TopicQuizRowData } from "@/components/quizzes/topic-quiz-row";
import {
  computeMockQuestionCount,
  computeMockTimeLimitMinutes,
  computePercentage,
} from "@/lib/quizzes/stats";
import { computeRecommendedQuizzes, type TopicPerf } from "@/lib/quizzes/recommend";
import { createClient } from "@/lib/supabase/server";
import type { QuizType, TopicDifficulty } from "@/types/database";

const CONTINUE_PRACTICE_LIMIT = 6;
const RECOMMENDED_LIMIT = 4;
const PREVIOUS_ATTEMPTS_LIMIT = 20;
const RECENTLY_STUDIED_DAYS = 14;
const MOCK_TEST_MIN_TOPICS = 3;

interface QuizRow {
  id: string;
  topic_id: string | null;
  subject_id: string | null;
  quiz_type: QuizType;
  title: string;
  difficulty: TopicDifficulty | null;
  time_limit_minutes: number | null;
  question_count: number;
  generated_at: string;
}

interface AttemptRow {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  current_question_index: number;
  time_taken_seconds: number | null;
}

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - RECENTLY_STUDIED_DAYS);

  const [
    { data: subjects },
    { data: topics },
    { data: quizzes },
    { data: attempts },
    { data: sessions },
  ] = await Promise.all([
    supabase.from("subjects").select("id, slug, name").eq("user_id", user.id).order("name"),
    supabase.from("topics").select("id, subject_id, slug, title, difficulty"),
    supabase
      .from("quizzes")
      .select(
        "id, topic_id, subject_id, quiz_type, title, difficulty, time_limit_minutes, question_count, generated_at",
      ),
    supabase
      .from("quiz_attempts")
      .select(
        "id, quiz_id, score, total_questions, started_at, completed_at, is_completed, current_question_index, time_taken_seconds",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false }),
    supabase
      .from("study_sessions")
      .select("topic_id, started_at")
      .gte("started_at", recentCutoff.toISOString()),
  ]);

  const allSubjects = subjects ?? [];
  const allTopics = topics ?? [];
  const allQuizzes: QuizRow[] = quizzes ?? [];
  const allAttempts: AttemptRow[] = attempts ?? [];

  const subjectById = new Map(allSubjects.map((s) => [s.id, s]));
  const topicById = new Map(allTopics.map((t) => [t.id, t]));
  const quizByTopicId = new Map(
    allQuizzes.filter((q) => q.quiz_type === "topic" && q.topic_id).map((q) => [q.topic_id!, q]),
  );
  const mockQuizBySubjectId = new Map(
    allQuizzes.filter((q) => q.quiz_type === "mock" && q.subject_id).map((q) => [q.subject_id!, q]),
  );

  const attemptsByQuizId = new Map<string, AttemptRow[]>();
  for (const a of allAttempts) {
    const list = attemptsByQuizId.get(a.quiz_id) ?? [];
    list.push(a);
    attemptsByQuizId.set(a.quiz_id, list);
  }

  function bestPercentageForQuiz(quizId: string | undefined): number | null {
    if (!quizId) return null;
    const completed = (attemptsByQuizId.get(quizId) ?? []).filter((a) => a.is_completed);
    if (completed.length === 0) return null;
    return Math.max(...completed.map((a) => computePercentage(a.score, a.total_questions)));
  }

  const recentlyStudiedTopicIds = new Set((sessions ?? []).map((s) => s.topic_id));

  // --- Subject Quiz Library + Recommended-for-You inputs -----------------

  const topicPerf: TopicPerf[] = allTopics
    .map((t) => {
      const subject = subjectById.get(t.subject_id);
      if (!subject) return null;
      const quiz = quizByTopicId.get(t.id);
      const perf: TopicPerf = {
        topicId: t.id,
        topicSlug: t.slug,
        topicTitle: t.title,
        subjectName: subject.name,
        subjectSlug: subject.slug,
        difficulty: t.difficulty,
        questionCount: quiz?.question_count ?? null,
        bestPercentage: bestPercentageForQuiz(quiz?.id),
        recentlyStudied: recentlyStudiedTopicIds.has(t.id),
      };
      return perf;
    })
    .filter((p): p is TopicPerf => p !== null);

  const recommended = computeRecommendedQuizzes(topicPerf, RECOMMENDED_LIMIT);

  const subjectLibrary: SubjectQuizLibraryData[] = allSubjects
    .map((s) => {
      const subjectTopics = allTopics.filter((t) => t.subject_id === s.id);
      const topicQuizzes: TopicQuizRowData[] = subjectTopics.map((t) => {
        const quiz = quizByTopicId.get(t.id);
        return {
          topicId: t.id,
          topicTitle: t.title,
          subjectName: s.name,
          subjectSlug: s.slug,
          difficulty: t.difficulty,
          questionCount: quiz?.question_count ?? null,
          bestPercentage: bestPercentageForQuiz(quiz?.id),
        };
      });
      return {
        slug: s.slug,
        name: s.name,
        topicsTotal: subjectTopics.length,
        quizzesGenerated: topicQuizzes.filter((t) => t.questionCount !== null).length,
        topicQuizzes,
      };
    })
    .filter((s) => s.topicsTotal > 0);

  // --- Mock Tests ----------------------------------------------------------

  const mockTests: MockTestCardData[] = allSubjects
    .map((s) => {
      const subjectTopics = allTopics.filter((t) => t.subject_id === s.id);
      if (subjectTopics.length < MOCK_TEST_MIN_TOPICS) return null;
      const quiz = mockQuizBySubjectId.get(s.id);
      const questionCount = quiz?.question_count ?? computeMockQuestionCount(subjectTopics.length);
      const timeLimitMinutes =
        quiz?.time_limit_minutes ?? computeMockTimeLimitMinutes(questionCount);
      const test: MockTestCardData = {
        subjectId: s.id,
        subjectSlug: s.slug,
        subjectName: s.name,
        questionCount,
        timeLimitMinutes,
        bestPercentage: bestPercentageForQuiz(quiz?.id),
        generated: Boolean(quiz),
      };
      return test;
    })
    .filter((m): m is MockTestCardData => m !== null);

  // --- Continue Practice (most recent attempt per quiz, any status) -------

  function quizTitleAndSubject(quizId: string): { title: string; subjectName: string } | null {
    const quiz = allQuizzes.find((q) => q.id === quizId);
    if (!quiz) return null;
    if (quiz.quiz_type === "topic" && quiz.topic_id) {
      const topic = topicById.get(quiz.topic_id);
      const subject = topic ? subjectById.get(topic.subject_id) : undefined;
      return { title: quiz.title, subjectName: subject?.name ?? "" };
    }
    const subject = quiz.subject_id ? subjectById.get(quiz.subject_id) : undefined;
    return { title: quiz.title, subjectName: subject?.name ?? "" };
  }

  const seenQuizIds = new Set<string>();
  const continuePractice: ContinuePracticeItem[] = [];
  for (const a of allAttempts) {
    if (seenQuizIds.has(a.quiz_id)) continue;
    seenQuizIds.add(a.quiz_id);
    const meta = quizTitleAndSubject(a.quiz_id);
    if (!meta) continue;
    const progressPercent = a.is_completed
      ? 100
      : a.total_questions > 0
        ? Math.round((a.current_question_index / a.total_questions) * 100)
        : 0;
    continuePractice.push({
      attemptId: a.id,
      quizTitle: meta.title,
      subjectName: meta.subjectName,
      questionCount: a.total_questions,
      progressPercent,
      isCompleted: a.is_completed,
      score: a.is_completed ? a.score : null,
    });
    if (continuePractice.length >= CONTINUE_PRACTICE_LIMIT) break;
  }

  // --- Previous Attempts ---------------------------------------------------

  const previousAttempts: PreviousAttemptData[] = allAttempts
    .filter((a) => a.is_completed && a.completed_at)
    .sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1))
    .slice(0, PREVIOUS_ATTEMPTS_LIMIT)
    .map((a) => {
      const meta = quizTitleAndSubject(a.quiz_id);
      return {
        attemptId: a.id,
        quizTitle: meta?.title ?? "Quiz",
        subjectName: meta?.subjectName ?? "",
        completedAt: a.completed_at!,
        score: a.score,
        totalQuestions: a.total_questions,
        timeTakenSeconds: a.time_taken_seconds,
      };
    });

  // --- Top summary stats ----------------------------------------------------

  const completedAttempts = allAttempts.filter((a) => a.is_completed);
  const percentages = completedAttempts.map((a) => computePercentage(a.score, a.total_questions));
  const summary: QuizzesSummary = {
    available: allQuizzes.length,
    completed: completedAttempts.length,
    averagePercentage:
      percentages.length > 0
        ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length)
        : null,
    bestPercentage: percentages.length > 0 ? Math.max(...percentages) : null,
  };

  const subjectOptions = allSubjects.map((s) => ({ value: s.slug, label: s.name }));
  const topicOptions = allTopics.map((t) => ({ value: t.id, label: t.title }));

  return (
    <QuizzesShell
      summary={summary}
      continuePractice={continuePractice}
      recommended={recommended}
      subjects={subjectLibrary}
      mockTests={mockTests}
      previousAttempts={previousAttempts}
      subjectOptions={subjectOptions}
      topicOptions={topicOptions}
    />
  );
}
