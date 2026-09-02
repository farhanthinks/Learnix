"use client";

import { BookOpen, Clock, Layers, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EditSubjectModal } from "@/components/subjects/edit-subject-modal";
import { formatDate } from "@/lib/format";
import { formatDurationLabel } from "@/lib/calendar/session";

export type SubjectStatus = "completed" | "not_started" | "in_progress";

export interface SubjectRowData {
  id: string;
  slug: string;
  name: string;
  examDate: string | null;
  topicsTotal: number;
  topicsDone: number;
  unitsTotal: number;
  estimatedMinutes: number;
  status: SubjectStatus;
  /** Independent of `status` — a subject can be "in progress" AND have an
   * exam within the next 10 days at the same time. */
  examSoon: boolean;
  daysUntilExam: number | null;
}

const STATUS_META: Record<SubjectStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-accent-success/10 text-accent-success" },
  not_started: { label: "Not started", className: "bg-text-secondary/10 text-text-secondary" },
  in_progress: { label: "In progress", className: "bg-accent-primary/10 text-accent-primary" },
};

const ICON_BG = [
  "bg-accent-primary/10 text-accent-primary",
  "bg-accent-success/10 text-accent-success",
  "bg-accent-warning/10 text-accent-warning",
];

export function SubjectRow({ subject, index }: { subject: SubjectRowData; index: number }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const percent =
    subject.topicsTotal === 0 ? 0 : Math.round((subject.topicsDone / subject.topicsTotal) * 100);
  const status = STATUS_META[subject.status];
  const iconBg = ICON_BG[index % ICON_BG.length];
  const studyPlanHref = `/dashboard/study-plan?subject=${subject.slug}`;

  async function handleRegenerate() {
    setMenuOpen(false);
    setError(null);
    setIsBusy(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}/reextract`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not regenerate topics.");
        setIsBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm(
      `Delete ${subject.name}? This removes all its topics and study plan too.`,
    );
    if (!confirmed) return;

    setError(null);
    setIsBusy(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not delete the subject.");
        setIsBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsBusy(false);
    }
  }

  return (
    <div className="border-border border-b px-1 py-5 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/subjects/${subject.slug}`}
                className="hover:text-accent-primary text-text-primary text-sm font-bold tracking-wide uppercase"
              >
                {subject.name}
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
              >
                {status.label}
              </span>
              {subject.examSoon && (
                <span className="bg-accent-danger/10 text-accent-danger rounded-full px-2 py-0.5 text-[11px] font-medium">
                  Exam soon
                </span>
              )}
              {subject.examSoon && subject.daysUntilExam !== null && (
                <span className="text-accent-danger text-[11px] font-medium">
                  {subject.daysUntilExam} {subject.daysUntilExam === 1 ? "day" : "days"} left
                </span>
              )}
            </div>
            {subject.examDate && (
              <p className="text-accent-primary mt-0.5 text-xs font-medium">
                Exam: {formatDate(subject.examDate)}
              </p>
            )}
            <div className="text-text-secondary mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                {subject.topicsTotal} Topics
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
                {subject.unitsTotal} Units
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                {formatDurationLabel(subject.estimatedMinutes)} Estimated
              </span>
            </div>
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Subject actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={isBusy}
            onClick={() => setMenuOpen((v) => !v)}
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="border-border bg-surface absolute top-9 right-0 z-20 w-52 overflow-hidden rounded-lg border py-1 shadow-lg"
            >
              <Link
                href={`/dashboard/subjects/${subject.slug}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                View Syllabus
              </Link>
              <Link
                href={studyPlanHref}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Study Plan
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Edit Subject
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleRegenerate}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Regenerate Topics
              </button>
              <a
                href={`/api/export/ics?subject_id=${subject.id}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Export Study Plan
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                className="text-accent-danger hover:bg-accent-danger/10 block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Delete Subject
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-accent-danger mt-2 text-xs">{error}</p>}

      {subject.topicsTotal > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${percent === 100 ? "bg-accent-success" : "bg-accent-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-text-secondary w-9 shrink-0 text-right text-xs font-medium">
            {percent}%
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Link
          href={`/dashboard/subjects/${subject.slug}`}
          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          View Syllabus
        </Link>
        <Link
          href={studyPlanHref}
          className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
        >
          Study Plan →
        </Link>
      </div>

      {editOpen && (
        <EditSubjectModal
          subjectId={subject.id}
          name={subject.name}
          examDate={subject.examDate}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
