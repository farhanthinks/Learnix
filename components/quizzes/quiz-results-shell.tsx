"use client";

import { AlertTriangle, CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RecommendedQuizCard } from "@/components/quizzes/recommended-quiz-card";
import { ReviewAnswersList, type ReviewQuestion } from "@/components/quizzes/review-answers-list";
import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import { formatDurationSeconds } from "@/lib/quizzes/stats";
import type { RecommendedQuiz } from "@/lib/quizzes/recommend";

export interface TopicBreakdownEntry {
  topicId: string;
  topicTitle: string;
  correct: number;
  total: number;
  percentage: number;
}

function StatChip({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div>
        <p className="text-text-primary font-mono text-lg font-bold">{value}</p>
        <p className="text-text-secondary text-xs">{label}</p>
      </div>
    </div>
  );
}

export function QuizResultsShell({
  attemptId,
  quizTitle,
  subjectName,
  score,
  totalQuestions,
  percentage,
  incorrectCount,
  skippedCount,
  timeTakenSeconds,
  topicBreakdown,
  weakAreas,
  recommendedNext,
  reviewQuestions,
}: {
  attemptId: string;
  quizTitle: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  incorrectCount: number;
  skippedCount: number;
  timeTakenSeconds: number | null;
  topicBreakdown: TopicBreakdownEntry[];
  weakAreas: TopicBreakdownEntry[];
  recommendedNext: RecommendedQuiz[];
  reviewQuestions: ReviewQuestion[];
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <Link
          href="/dashboard/quizzes"
          className="text-accent-primary text-xs font-medium hover:underline"
        >
          ← Back to Quizzes
        </Link>
        <h1 className="font-display text-text-primary mt-1 text-xl font-semibold">{quizTitle}</h1>
        <p className="text-text-secondary text-sm">{subjectName}</p>
      </div>

      <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
        <p className="text-text-secondary text-sm font-medium">Final Score</p>
        <p className="text-accent-primary font-mono text-4xl font-bold">{percentage}%</p>
        <p className="text-text-secondary text-sm">
          {score} / {totalQuestions} correct
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip
          icon={CheckCircle2}
          label="Correct"
          value={score}
          className="bg-accent-success/10 text-accent-success"
        />
        <StatChip
          icon={XCircle}
          label="Incorrect"
          value={incorrectCount}
          className="bg-accent-danger/10 text-accent-danger"
        />
        <StatChip
          icon={Circle}
          label="Skipped"
          value={skippedCount}
          className="bg-text-secondary/10 text-text-secondary"
        />
        <StatChip
          icon={Clock3}
          label="Time Taken"
          value={timeTakenSeconds !== null ? formatDurationSeconds(timeTakenSeconds) : "—"}
          className="bg-accent-primary/10 text-accent-primary"
        />
      </div>

      {topicBreakdown.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-text-primary text-sm font-semibold">Topic-wise Performance</h2>
          <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
            {topicBreakdown.map((t) => (
              <div key={t.topicId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{t.topicTitle}</span>
                  <span className="text-text-secondary">
                    {t.correct}/{t.total} · {t.percentage}%
                  </span>
                </div>
                <div className="bg-surface-raised mt-1 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${t.percentage < 60 ? "bg-accent-danger" : "bg-accent-success"}`}
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {weakAreas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-text-primary flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="text-accent-warning h-4 w-4" strokeWidth={2} />
            Weak Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((t) => (
              <span
                key={t.topicId}
                className="bg-accent-warning/10 text-accent-warning rounded-full px-3 py-1 text-xs font-medium"
              >
                {t.topicTitle} · {t.percentage}%
              </span>
            ))}
          </div>
        </section>
      )}

      {recommendedNext.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-text-primary text-sm font-semibold">Recommended Next Quizzes</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recommendedNext.map((r) => (
              <RecommendedQuizCard key={r.topicId} quiz={r} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setReviewOpen((v) => !v)}
          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          {reviewOpen ? "Hide Review" : "Review Answers"}
        </button>
        <StartQuizButton
          target={{ mode: "retry", attemptId }}
          label="Retry Quiz"
          variant="outline"
        />
      </div>

      {reviewOpen && <ReviewAnswersList questions={reviewQuestions} />}
    </div>
  );
}
