"use client";

import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatCountdown } from "@/lib/quizzes/stats";
import type { QuizQuestionType } from "@/types/database";

export interface TakeQuestion {
  id: string;
  question: string;
  question_type: QuizQuestionType;
  options: string[] | null;
}

export function QuizTakeShell({
  attemptId,
  quizTitle,
  timeLimitMinutes,
  startedAt,
  questions,
  initialAnswers,
  initialIndex,
  initialFlagged,
}: {
  attemptId: string;
  quizTitle: string;
  timeLimitMinutes: number | null;
  startedAt: string;
  questions: TakeQuestion[];
  initialAnswers: Record<string, string>;
  initialIndex: number;
  initialFlagged: string[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), questions.length - 1));
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [flagged, setFlagged] = useState<Set<string>>(new Set(initialFlagged));
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSubmitted = useRef(false);
  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const currentAnswer = answers[question.id] ?? "";
  const isFlagged = flagged.has(question.id);
  const timeLimitSeconds = timeLimitMinutes !== null ? timeLimitMinutes * 60 : null;
  const remainingSeconds = timeLimitSeconds !== null ? timeLimitSeconds - elapsedSeconds : null;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch(`/api/quizzes/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          currentQuestionIndex: index,
          flaggedQuestions: Array.from(flagged),
        }),
      }).catch(() => {});
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, index, flagged]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          flaggedQuestions: Array.from(flagged),
          timeTakenSeconds: elapsedSeconds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not submit your attempt.");
      router.push(`/dashboard/quizzes/results/${attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (remainingSeconds !== null && remainingSeconds <= 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }

  return (
    <div className="bg-bg mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-xl font-semibold">{quizTitle}</h1>
          <p className="text-text-secondary text-sm">
            Question {index + 1} / {questions.length}
          </p>
        </div>
        {remainingSeconds !== null && (
          <span
            className={`rounded-lg px-3 py-1.5 font-mono text-sm font-semibold ${
              remainingSeconds < 60
                ? "bg-accent-danger/10 text-accent-danger"
                : "bg-accent-primary/10 text-accent-primary"
            }`}
          >
            {formatCountdown(remainingSeconds)}
          </span>
        )}
      </div>

      <div className="bg-surface-raised h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent-primary h-full rounded-full transition-[width]"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-text-primary text-base font-medium">{question.question}</p>
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={isFlagged}
            aria-label="Flag question"
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isFlagged
                ? "bg-accent-warning/15 text-accent-warning"
                : "text-text-secondary hover:bg-surface-raised"
            }`}
          >
            <Flag
              className="h-3.5 w-3.5"
              strokeWidth={2}
              fill={isFlagged ? "currentColor" : "none"}
            />
            {isFlagged ? "Flagged" : "Flag Question"}
          </button>
        </div>

        {question.question_type === "mcq" ? (
          <div className="flex flex-col gap-2">
            {question.options?.map((opt) => (
              <label
                key={opt}
                className={`text-text-primary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  currentAnswer === opt
                    ? "border-accent-primary bg-accent-primary/10"
                    : "border-border hover:bg-surface-raised"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={currentAnswer === opt}
                  onChange={() => setAnswer(opt)}
                  className="accent-accent-primary"
                />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          />
        )}
      </div>

      {error && <p className="text-accent-danger text-sm">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
        >
          Previous
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
