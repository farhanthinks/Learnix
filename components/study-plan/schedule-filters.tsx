"use client";

import type { TopicDifficulty, TopicStatus } from "@/types/database";

export type StatusFilterValue = "all" | TopicStatus;
export type DifficultyFilterValue = "all" | TopicDifficulty;

export interface ScheduleFilterState {
  subjectId: string | null;
  status: StatusFilterValue;
  difficulty: DifficultyFilterValue;
}

export function defaultScheduleFilters(subjectId: string | null = null): ScheduleFilterState {
  return { subjectId, status: "all", difficulty: "all" };
}

export function hasActiveScheduleFilters(filters: ScheduleFilterState): boolean {
  return filters.subjectId !== null || filters.status !== "all" || filters.difficulty !== "all";
}

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Completed" },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilterValue; label: string }[] = [
  { value: "all", label: "All Difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SELECT_CLASS =
  "border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary rounded-lg border px-2.5 py-1.5 text-sm focus:ring-1 focus:outline-none";

export function ScheduleFiltersBar({
  filters,
  onChange,
  subjects,
}: {
  filters: ScheduleFilterState;
  onChange: (filters: ScheduleFilterState) => void;
  subjects: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Filter by subject"
        value={filters.subjectId ?? "all"}
        onChange={(e) =>
          onChange({ ...filters, subjectId: e.target.value === "all" ? null : e.target.value })
        }
        className={SELECT_CLASS}
      >
        <option value="all">All Subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as StatusFilterValue })}
        className={SELECT_CLASS}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by difficulty"
        value={filters.difficulty}
        onChange={(e) =>
          onChange({ ...filters, difficulty: e.target.value as DifficultyFilterValue })
        }
        className={SELECT_CLASS}
      >
        {DIFFICULTY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {hasActiveScheduleFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(defaultScheduleFilters())}
          className="text-accent-primary text-xs font-medium hover:underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
