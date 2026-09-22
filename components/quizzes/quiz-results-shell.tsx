"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ReviewAnswersList, type ReviewQuestion } from "@/components/quizzes/review-answers-list";
import { StartQuizButton } from "@/components/quizzes/start-quiz-button";

function StatChip({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
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
  subjectSlug,
  score,
  totalQuestions,
  percentage,
  incorrectCount,
  reviewQuestions,
}: {
  attemptId: string;
  quizTitle: string;
  subjectName: string;
  subjectSlug: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  incorrectCount: number;
  reviewQuestions: ReviewQuestion[];
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-text-secondary text-sm">{subjectName}</p>
        <h1 className="font-display text-text-primary text-xl font-semibold">{quizTitle}</h1>
      </div>

      <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
        <p className="text-text-secondary text-sm font-medium">Score</p>
        <p className="text-accent-primary font-mono text-4xl font-bold">{percentage}%</p>
        <p className="text-text-secondary text-sm">
          {score} / {totalQuestions} correct
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StartQuizButton target={{ mode: "retry", attemptId }} label="Retry Quiz" />
        <Link
          href={`/dashboard/quizzes/${subjectSlug}`}
          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          Back to Topics
        </Link>
        <button
          type="button"
          onClick={() => setReviewOpen((v) => !v)}
          className="text-accent-primary ml-auto text-sm font-medium hover:underline"
        >
          {reviewOpen ? "Hide Review" : "Review Answers"}
        </button>
      </div>

      {reviewOpen && <ReviewAnswersList questions={reviewQuestions} />}
    </div>
  );
}
