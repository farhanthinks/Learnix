"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StartMode =
  | { mode: "topic"; topicId: string }
  | { mode: "mock"; subjectId: string }
  | { mode: "retry"; attemptId: string };

const VARIANT_CLASSES = {
  primary: "bg-accent-primary text-white hover:brightness-110",
  outline: "border-border text-text-primary hover:bg-surface-raised border",
};

export function StartQuizButton({
  target,
  label,
  loadingLabel = "Starting...",
  variant = "primary",
  className = "",
  fullWidth = false,
}: {
  target: StartMode;
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "outline";
  className?: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quizzes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start the quiz.");
      router.push(`/dashboard/quizzes/take/${json.attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? "w-full items-stretch" : "items-end"}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${fullWidth ? "w-full" : "w-auto shrink-0"} ${VARIANT_CLASSES[variant]} ${className}`}
      >
        {busy ? loadingLabel : label}
      </button>
      {error && <p className="text-accent-danger text-right text-xs">{error}</p>}
    </div>
  );
}
