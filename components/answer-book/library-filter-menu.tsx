"use client";

import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { TopicDifficulty } from "@/types/database";

export type LibraryFilters = Set<TopicDifficulty>;

const OPTIONS: { value: TopicDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function LibraryFilterMenu({
  filters,
  onChange,
}: {
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function toggle(value: TopicDifficulty) {
    const next = new Set(filters);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Filter materials"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
      >
        <Filter className="h-4 w-4" strokeWidth={2} />
        {filters.size > 0 && (
          <span className="bg-accent-primary absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
            {filters.size}
          </span>
        )}
      </button>
      {open && (
        <div className="border-border bg-surface absolute top-11 right-0 z-20 w-48 rounded-xl border p-4 shadow-lg">
          <p className="text-text-secondary text-xs font-semibold">Difficulty</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {OPTIONS.map((o) => {
              const active = filters.has(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
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
      )}
    </div>
  );
}
