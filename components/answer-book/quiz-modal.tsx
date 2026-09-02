"use client";

import { X } from "lucide-react";

import { QuizPanel, type AttemptSummary } from "@/components/topics/quiz-panel";
import type { QuizQuestion } from "@/types/database";

export function QuizModal({
  topicId,
  quiz,
  questions,
  attemptSummary,
  onClose,
}: {
  topicId: string;
  quiz: { id: string } | null;
  questions: QuizQuestion[];
  attemptSummary: AttemptSummary | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quiz"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <p className="text-text-primary text-sm font-semibold">Quiz</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <QuizPanel
            topicId={topicId}
            quiz={quiz}
            questions={questions}
            attemptSummary={attemptSummary}
          />
        </div>
      </div>
    </div>
  );
}
