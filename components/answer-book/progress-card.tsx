"use client";

import { Check, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

import { formatDurationLabel } from "@/lib/calendar/session";
import type { TopicStatus } from "@/types/database";

const STATUS_META: Record<TopicStatus, { percent: number; label: string }> = {
  pending: { percent: 0, label: "Not Started" },
  in_progress: { percent: 50, label: "In Progress" },
  done: { percent: 100, label: "Completed" },
};

function ProgressRing({ percent }: { percent: number }) {
  const size = 52;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={percent === 100 ? "var(--color-accent-success)" : "var(--color-accent-primary)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function ProgressCard({
  topicId,
  timeSpentMinutes,
  questionsSolved,
  questionsTotal,
  status,
}: {
  topicId: string;
  timeSpentMinutes: number;
  questionsSolved: number;
  questionsTotal: number;
  status: TopicStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isSaving, setIsSaving] = useState(false);
  const done = currentStatus === "done";
  const meta = STATUS_META[currentStatus];

  async function toggleComplete() {
    const previous = currentStatus;
    const next: TopicStatus = done ? "pending" : "done";
    setCurrentStatus(next);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setCurrentStatus(previous);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Your Progress</h2>

      <div className="flex items-center gap-3">
        <ProgressRing percent={meta.percent} />
        <div>
          <p
            className={`text-sm font-semibold ${meta.percent === 100 ? "text-accent-success" : "text-text-primary"}`}
          >
            {meta.label}
          </p>
          <p className="text-text-secondary font-mono text-xs">{meta.percent}%</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="bg-accent-primary/10 text-accent-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Clock className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-text-secondary text-xs">Time Spent</p>
          <p className="text-text-primary text-sm font-semibold">
            {formatDurationLabel(timeSpentMinutes)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="bg-accent-success/10 text-accent-success flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-text-secondary text-xs">Questions Solved</p>
          <p className="text-text-primary text-sm font-semibold">
            {questionsSolved} / {questionsTotal}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleComplete}
        disabled={isSaving}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          done
            ? "bg-accent-success/10 text-accent-success hover:bg-accent-success/20"
            : "bg-accent-primary text-white hover:brightness-110"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
        {done ? "Completed — Undo" : "Mark as Completed"}
      </button>
    </div>
  );
}
