"use client";

import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { QuizType, TopicDifficulty } from "@/types/database";

export interface QuizFilters {
  subjects: Set<string>;
  difficulties: Set<TopicDifficulty>;
  topics: Set<string>;
  quizTypes: Set<QuizType>;
}

export function emptyQuizFilters(): QuizFilters {
  return { subjects: new Set(), difficulties: new Set(), topics: new Set(), quizTypes: new Set() };
}

export function countActiveFilters(filters: QuizFilters): number {
  return (
    filters.subjects.size + filters.difficulties.size + filters.topics.size + filters.quizTypes.size
  );
}

const DIFFICULTY_OPTIONS: { value: TopicDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QUIZ_TYPE_OPTIONS: { value: QuizType; label: string }[] = [
  { value: "topic", label: "Topic Quiz" },
  { value: "mock", label: "Mock Test" },
];

function ChipGroup<T extends string>({
  options,
  active,
  onToggle,
}: {
  options: { value: T; label: string }[];
  active: Set<T>;
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const isActive = active.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-accent-primary border-accent-primary text-white"
                : "border-border text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function QuizzesFilterMenu({
  filters,
  onChange,
  subjectOptions,
  topicOptions,
}: {
  filters: QuizFilters;
  onChange: (filters: QuizFilters) => void;
  subjectOptions: { value: string; label: string }[];
  topicOptions: { value: string; label: string }[];
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

  function toggleIn<K extends keyof QuizFilters>(key: K, value: string) {
    const next = { ...filters, [key]: new Set(filters[key] as Set<string>) } as QuizFilters;
    const set = next[key] as Set<string>;
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Filter quizzes"
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
        <div className="border-border bg-surface absolute top-11 right-0 z-20 flex w-64 flex-col gap-3 rounded-xl border p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-text-primary text-sm font-semibold">Filters</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => onChange(emptyQuizFilters())}
                className="text-accent-primary text-xs font-medium hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-text-secondary text-xs font-semibold">Quiz Type</p>
            <div className="mt-1.5">
              <ChipGroup
                options={QUIZ_TYPE_OPTIONS}
                active={filters.quizTypes}
                onToggle={(v) => toggleIn("quizTypes", v)}
              />
            </div>
          </div>

          <div>
            <p className="text-text-secondary text-xs font-semibold">Difficulty</p>
            <div className="mt-1.5">
              <ChipGroup
                options={DIFFICULTY_OPTIONS}
                active={filters.difficulties}
                onToggle={(v) => toggleIn("difficulties", v)}
              />
            </div>
          </div>

          {subjectOptions.length > 0 && (
            <div>
              <p className="text-text-secondary text-xs font-semibold">Subject</p>
              <div className="mt-1.5">
                <ChipGroup
                  options={subjectOptions}
                  active={filters.subjects}
                  onToggle={(v) => toggleIn("subjects", v)}
                />
              </div>
            </div>
          )}

          {topicOptions.length > 0 && (
            <div>
              <p className="text-text-secondary text-xs font-semibold">Topic</p>
              <div className="mt-1.5 max-h-40 overflow-y-auto">
                <ChipGroup
                  options={topicOptions}
                  active={filters.topics}
                  onToggle={(v) => toggleIn("topics", v)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
