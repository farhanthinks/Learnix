import { Calendar, Clock3, Flame, ListChecks, TrendingUp } from "lucide-react";
import Link from "next/link";

import { CompletionBySubjectCard } from "@/components/analytics/completion-by-subject-card";
import { CompletionTrendCard } from "@/components/analytics/completion-trend-card";
import { KpiCard } from "@/components/analytics/kpi-card";
import { NeedsAttentionTable } from "@/components/analytics/needs-attention-table";
import { QuestionPerformanceCard } from "@/components/analytics/question-performance-card";
import { QuizAccuracyCard } from "@/components/analytics/quiz-accuracy-card";
import { StudyTimeCard } from "@/components/analytics/study-time-card";
import { TopicMasteryCard } from "@/components/analytics/topic-mastery-card";
import { Card } from "@/components/ui/card";
import {
  computeAnalytics,
  computeCompletionTrend,
  computeTopicMastery,
} from "@/lib/analytics/compute";
import { buildNeedsAttentionRows } from "@/lib/analytics/needs-attention";
import { computeQuestionPerformance, computeQuizAccuracy } from "@/lib/analytics/quiz-stats";
import { computeLongestStreak, computeStreak } from "@/lib/study-plan/streak";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const NEEDS_ATTENTION_PREVIEW_LIMIT = 6;

function toDateStringLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRangeLabel(start: Date, end: Date): string {
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

function parseJsonRecord(value: Json | null): Record<string, string> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {};
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date();
  const todayIso = toDateStringLocal(today);

  const [subjectsRes, topicsRes, plansRes, sessionsRes] = await Promise.all([
    supabase.from("subjects").select("id, slug, name, exam_date").eq("user_id", user.id),
    supabase.from("topics").select("id, subject_id, slug, title, difficulty, status"),
    supabase.from("study_plans").select("topic_id, scheduled_date"),
    supabase
      .from("study_sessions")
      .select("topic_id, started_at, duration_minutes")
      .not("ended_at", "is", null),
  ]);

  const subjects = subjectsRes.data ?? [];

  if (subjects.length === 0) {
    return (
      <div className="bg-bg mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-10">
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <h1 className="font-display text-text-primary text-lg font-semibold">No analytics yet</h1>
          <p className="text-text-secondary max-w-sm text-sm">
            Add a subject and start studying to see your analytics here.
          </p>
          <Link
            href="/dashboard/subjects/new"
            className="text-accent-primary mt-2 text-sm font-medium hover:underline"
          >
            + Add Subject
          </Link>
        </Card>
      </div>
    );
  }

  const topics = topicsRes.data ?? [];
  const plans = plansRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  const analytics = computeAnalytics(subjects, topics, plans, sessions, today);
  const weakTopicIds = new Set(analytics.weakTopics.map((t) => t.topicId));
  const mastery = computeTopicMastery(topics, weakTopicIds);
  const trend = computeCompletionTrend(topics, sessions, today);
  const weekOverWeekDelta =
    trend.length >= 2 ? trend[trend.length - 1].percent - trend[trend.length - 2].percent : 0;

  const studiedDates = new Set(sessions.map((s) => s.started_at.slice(0, 10)));
  const currentStreak = computeStreak(studiedDates, todayIso);
  const bestStreak = computeLongestStreak(studiedDates);

  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score, total_questions, answers")
    .eq("user_id", user.id)
    .eq("is_completed", true);

  const attempts = quizAttempts ?? [];
  const quizIds = Array.from(new Set(attempts.map((a) => a.quiz_id)));

  const { data: quizQuestions } =
    quizIds.length > 0
      ? await supabase
          .from("quiz_questions")
          .select("id, quiz_id, correct_answer")
          .in("quiz_id", quizIds)
      : { data: [] };

  const questionsByQuizId = new Map<string, { id: string; correct_answer: string }[]>();
  for (const q of quizQuestions ?? []) {
    const list = questionsByQuizId.get(q.quiz_id) ?? [];
    list.push({ id: q.id, correct_answer: q.correct_answer });
    questionsByQuizId.set(q.quiz_id, list);
  }

  const quizAccuracy = computeQuizAccuracy(attempts);
  const questionPerformance = computeQuestionPerformance(
    attempts.map((a) => ({ quiz_id: a.quiz_id, answers: parseJsonRecord(a.answers) })),
    questionsByQuizId,
  );

  const topicSlugById = new Map(topics.map((t) => [t.id, t.slug]));
  const needsAttentionRows = buildNeedsAttentionRows(
    analytics.weakTopics,
    analytics.subjects,
    topicSlugById,
  );

  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 6);
  const rangeLabel = formatRangeLabel(rangeStart, today);

  const topicsRemaining = analytics.overview.topicsTotal - analytics.overview.topicsDone;
  const avgMinutesPerDay = Math.round(analytics.overview.weekMinutes / 7);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">Analytics</h1>
          <p className="text-text-secondary text-sm">
            Track your learning progress and performance.
          </p>
        </div>
        <span className="border-border text-text-secondary inline-flex w-auto items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
          <Calendar className="h-4 w-4" strokeWidth={2} />
          {rangeLabel}
        </span>
      </header>

      {/* Section 1 — Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ListChecks}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Topics Completed"
          value={`${analytics.overview.topicsDone} / ${analytics.overview.topicsTotal}`}
          footer={
            <div className="flex flex-col gap-1.5">
              <div className="bg-surface-raised h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-accent-primary h-full rounded-full"
                  style={{ width: `${analytics.overview.percentComplete}%` }}
                />
              </div>
              <span className="text-text-secondary text-xs">
                {topicsRemaining} topics remaining
              </span>
            </div>
          }
        />
        <KpiCard
          icon={TrendingUp}
          iconClassName="bg-accent-success/10 text-accent-success"
          label="Overall Completion"
          value={`${analytics.overview.percentComplete}%`}
          footer={
            <span
              className={`text-xs font-medium ${
                weekOverWeekDelta > 0
                  ? "text-accent-success"
                  : weekOverWeekDelta < 0
                    ? "text-accent-danger"
                    : "text-text-secondary"
              }`}
            >
              {weekOverWeekDelta > 0 ? "↑" : weekOverWeekDelta < 0 ? "↓" : "→"}{" "}
              {Math.abs(weekOverWeekDelta)}% from last week
            </span>
          }
        />
        <KpiCard
          icon={Clock3}
          iconClassName="bg-accent-warning/10 text-accent-warning"
          label="Study Time"
          value={`${analytics.overview.weekMinutes.toLocaleString()} min`}
          footer={
            <span className="text-text-secondary text-xs">Avg. {avgMinutesPerDay} min/day</span>
          }
        />
        <KpiCard
          icon={Flame}
          iconClassName="bg-accent-danger/10 text-accent-danger"
          label="Current Streak"
          value={`${currentStreak} ${currentStreak === 1 ? "day" : "days"}`}
          footer={<span className="text-text-secondary text-xs">Best: {bestStreak} days</span>}
        />
      </div>

      {/* Section 2 — Main Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CompletionBySubjectCard
          subjects={analytics.subjects}
          overallPercent={analytics.overview.percentComplete}
        />
        <StudyTimeCard weekly={analytics.weekly} />
        <CompletionTrendCard trend={trend} />
      </div>

      {/* Section 3 — Learning Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopicMasteryCard mastery={mastery} />
        <QuizAccuracyCard accuracyPercent={quizAccuracy.accuracyPercent} />
        <QuestionPerformanceCard result={questionPerformance} />
      </div>

      {/* Section 4 — Needs Attention */}
      <div className="border-border bg-surface rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-text-primary text-sm font-semibold">Needs Attention</h2>
            <p className="text-text-secondary mt-0.5 text-xs">
              Topics that need your attention based on progress, difficulty, and upcoming exams.
            </p>
          </div>
          {needsAttentionRows.length > NEEDS_ATTENTION_PREVIEW_LIMIT && (
            <Link
              href="/dashboard/study-plan"
              className="text-accent-primary shrink-0 text-xs font-medium hover:underline"
            >
              View all →
            </Link>
          )}
        </div>
        <div className="mt-4">
          <NeedsAttentionTable rows={needsAttentionRows.slice(0, NEEDS_ATTENTION_PREVIEW_LIMIT)} />
        </div>
      </div>
    </div>
  );
}
