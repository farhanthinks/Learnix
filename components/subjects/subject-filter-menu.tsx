"use client";

import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SubjectStatus } from "@/components/subjects/subject-row";

export type ExamWindow = "upcoming" | "later";
export type ProgressBand = "0-25" | "26-50" | "51-75" | "76-100";

export interface SubjectFilters {
  status: Set<SubjectStatus>;
  examWindow: Set<ExamWindow>;
  progress: Set<ProgressBand>;
}

export function emptyFilters(): SubjectFilters {
  return { status: new Set(), examWindow: new Set(), progress: new Set() };
}

export function countActiveFilters(f: SubjectFilters): number {
  return f.status.size + f.examWindow.size + f.progress.size;
}

const STATUS_OPTIONS: { value: SubjectStatus; label: string }[] = [
  { value: "in_progress", label: "In progress" },
  { value: "not_started", label: "Not started" },
  { value: "completed", label: "Completed" },
];
const EXAM_OPTIONS: { value: ExamWindow; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "later", label: "Later" },
];
const PROGRESS_OPTIONS: { value: ProgressBand; label: string }[] = [
  { value: "0-25", label: "0–25%" },
  { value: "26-50", label: "26–50%" },
  { value: "51-75", label: "51–75%" },
  { value: "76-100", label: "76–100%" },
];

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: Set<T>;
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-text-secondary text-xs font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-accent-primary border-accent-primary text-white"
                  : "border-border text-text-secondary hover:bg-surface-raised"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SubjectFilterMenu({
  filters,
  onChange,
}: {
  filters: SubjectFilters;
  onChange: (filters: SubjectFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Filter subjects"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
      >
        <Filter className="h-4 w-4" strokeWidth={2} />
        {activeCount > 0 && (
          <span className="bg-accent-primary absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div className="border-border bg-surface absolute top-11 right-0 z-20 flex w-64 flex-col gap-4 rounded-xl border p-4 shadow-lg">
          <FilterGroup
            title="Status"
            options={STATUS_OPTIONS}
            selected={filters.status}
            onToggle={(v) => onChange({ ...filters, status: toggle(filters.status, v) })}
          />
          <FilterGroup
            title="Exam"
            options={EXAM_OPTIONS}
            selected={filters.examWindow}
            onToggle={(v) => onChange({ ...filters, examWindow: toggle(filters.examWindow, v) })}
          />
          <FilterGroup
            title="Progress"
            options={PROGRESS_OPTIONS}
            selected={filters.progress}
            onToggle={(v) => onChange({ ...filters, progress: toggle(filters.progress, v) })}
          />
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange(emptyFilters())}
              className="text-accent-primary self-start text-xs font-medium hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
