"use client";

import { useEffect, useState } from "react";

import type { MarkdownHeading } from "@/lib/answer-book/headings";

export function TocSidebar({
  headings,
  isNotesTabActive,
  onNavigate,
}: {
  headings: MarkdownHeading[];
  isNotesTabActive: boolean;
  onNavigate: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (!isNotesTabActive || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings, isNotesTabActive]);

  if (headings.length === 0) return null;

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">On This Topic</h2>
      <nav className="mt-3 flex flex-col gap-0.5">
        {headings.map((h) => {
          const isActive = isNotesTabActive && h.id === activeId;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setActiveId(h.id);
                onNavigate(h.id);
              }}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${h.depth === 3 ? "pl-6" : ""} ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-accent-primary" : "bg-border"}`}
              />
              {h.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
