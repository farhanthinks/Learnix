"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { QuizRunner } from "@/components/topics/quiz-runner";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { formatRelativeTime } from "@/lib/format";
import type { QuizQuestion } from "@/types/database";

export interface AttemptSummary {
  bestScore: number;
  total: number;
  lastAttemptAt: string;
}

export function QuizPanel({
  topicId,
  quiz,
  questions,
  attemptSummary,
}: {
  topicId: string;
  quiz: { id: string } | null;
  questions: QuizQuestion[];
  attemptSummary: AttemptSummary | null;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);

  async function handleGenerate() {
    if (quiz) {
      const confirmed = window.confirm(
        "Regenerating will delete this quiz's past attempts. Continue?",
      );
      if (!confirmed) return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/quiz`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate a quiz.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isTaking && quiz) {
    return (
      <QuizRunner
        quizId={quiz.id}
        questions={questions}
        onExit={() => {
          setIsTaking(false);
          router.refresh();
        }}
      />
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormError message={error ?? undefined} />
        <p className="text-text-secondary text-sm">No quiz yet for this topic.</p>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-auto px-4"
        >
          {isGenerating ? "Generating quiz..." : "Generate Quiz"}
        </Button>
        {isGenerating && (
          <p className="text-text-secondary text-xs">This usually takes 10-20 seconds.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error ?? undefined} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{questions.length} questions</p>
          {attemptSummary ? (
            <p className="text-text-secondary text-xs">
              Best score: {attemptSummary.bestScore}/{attemptSummary.total} · Last attempt{" "}
              {formatRelativeTime(attemptSummary.lastAttemptAt)}
            </p>
          ) : (
            <p className="text-text-secondary text-xs">Not attempted yet.</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-auto px-3 py-1.5 text-xs"
        >
          {isGenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
      <Button type="button" onClick={() => setIsTaking(true)} className="w-auto px-4">
        {attemptSummary ? "Retake Quiz" : "Start Quiz"}
      </Button>
    </div>
  );
}
