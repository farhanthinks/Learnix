"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import type { QuizQuestion } from "@/types/database";

type Phase = "taking" | "submitting" | "results";

function isCorrect(question: QuizQuestion, userAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
}

export function QuizRunner({
  quizId,
  questions,
  onExit,
}: {
  quizId: string;
  questions: QuizQuestion[];
  onExit: () => void;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("taking");
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const currentAnswer = answers[question?.id] ?? "";

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function handleNext() {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }

    setError(null);
    setPhase("submitting");
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not submit quiz.");
      setResult({ score: json.score, total: json.total });
      setPhase("results");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("taking");
    }
  }

  if (phase === "results" && result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-accent-primary/10 text-accent-primary rounded-lg px-4 py-3 text-sm font-medium">
          Score: {result.score} / {result.total}
        </div>
        <ul className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id] ?? "";
            const correct = isCorrect(q, userAnswer);
            return (
              <li
                key={q.id}
                className={`rounded-lg border p-3 ${
                  correct
                    ? "border-accent-success/30 bg-accent-success/10"
                    : "border-accent-danger/30 bg-accent-danger/10"
                }`}
              >
                <p className="text-text-primary text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <p className="text-text-secondary mt-1 text-sm">
                  Your answer:{" "}
                  <span className="text-text-primary font-medium">
                    {userAnswer || "(no answer)"}
                  </span>
                </p>
                {!correct && (
                  <p className="text-text-secondary text-sm">
                    Correct answer:{" "}
                    <span className="text-text-primary font-medium">{q.correct_answer}</span>
                  </p>
                )}
                {q.explanation && (
                  <p className="text-text-secondary mt-1 text-xs">{q.explanation}</p>
                )}
                {q.question_type === "short_answer" && !correct && (
                  <p className="text-text-secondary mt-1 text-xs">
                    Short-answer grading is a simple text match, not AI-verified — if your answer
                    was reasonable, use your judgement.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <Button type="button" variant="outline" onClick={onExit} className="w-auto px-4">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-secondary text-xs">
        Question {index + 1} of {questions.length}
      </p>
      <FormError message={error ?? undefined} />
      <p className="text-text-primary text-sm font-medium">{question.question}</p>

      {question.question_type === "mcq" ? (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt) => (
            <label
              key={opt}
              className={`text-text-primary flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
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
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          />
          <p className="text-text-secondary text-xs">
            Graded with a simple text match, not AI-verified.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="text-text-secondary hover:text-text-primary text-xs"
        >
          Exit quiz
        </button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={phase === "submitting" || !currentAnswer.trim()}
          className="w-auto px-4"
        >
          {phase === "submitting" ? "Submitting..." : isLast ? "Submit Quiz" : "Next"}
        </Button>
      </div>
    </div>
  );
}
