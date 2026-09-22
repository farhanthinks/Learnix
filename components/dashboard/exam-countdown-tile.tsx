import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/lib/format";

interface SubjectExam {
  name: string;
  exam_date: string | null;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExamCountdownTile({
  className = "",
  subjects,
}: {
  className?: string;
  subjects: SubjectExam[];
}) {
  const todayStr = todayString();

  const upcoming = subjects
    .filter(
      (s): s is { name: string; exam_date: string } =>
        Boolean(s.exam_date) && s.exam_date! >= todayStr,
    )
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];

  if (!upcoming) {
    return (
      <div
        className={`border-border bg-surface flex flex-col items-start justify-center gap-2 rounded-2xl border p-6 ${className}`}
      >
        <p className="text-text-secondary text-sm">No exams scheduled</p>
        <Link
          href="/dashboard/subjects/new"
          className="text-accent-primary focus-visible:outline-accent-primary text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Add an exam date →
        </Link>
      </div>
    );
  }

  const examDate = new Date(`${upcoming.exam_date}T00:00:00`);
  const today = new Date(`${todayStr}T00:00:00`);
  const daysRemaining = Math.round((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={`bg-accent-primary relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 text-white ${className}`}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-white/80">Days to Exam</p>
        <p className="rise-in font-mono text-5xl font-bold">{daysRemaining}</p>
      </div>
      <div>
        <p className="truncate text-sm font-semibold">{upcoming.name}</p>
        <p className="text-xs text-white/80">{formatDate(upcoming.exam_date)}</p>
      </div>
      <CalendarDays className="absolute right-5 bottom-5 h-8 w-8 text-white/25" strokeWidth={1.5} />
    </div>
  );
}
