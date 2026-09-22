"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface AssistantSubject {
  id: string;
  name: string;
}

export function SubjectDropdown({
  subjects,
  selectedId,
  onSelect,
}: {
  subjects: AssistantSubject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = subjects.find((s) => s.id === selectedId) ?? null;

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
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface text-text-primary hover:bg-surface-raised inline-flex w-auto items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
      >
        {selected ? selected.name : "Select a subject"}
        <ChevronDown
          className={`text-text-secondary h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="border-border bg-surface absolute top-11 left-0 z-20 max-h-72 w-64 overflow-y-auto rounded-lg border py-1 shadow-lg"
        >
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={s.id === selectedId}
              onClick={() => {
                onSelect(s.id);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                s.id === selectedId
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-primary hover:bg-surface-raised"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
