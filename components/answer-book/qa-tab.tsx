"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function QaTab({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) {
    return <p className="text-text-secondary text-sm">No practice questions generated.</p>;
  }

  return (
    <div className="border-border divide-border divide-y rounded-lg border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="hover:bg-surface-raised flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
            >
              <span className="text-text-primary text-sm font-medium">
                <span className="text-text-secondary font-mono">Q{i + 1}.</span> {item.question}
              </span>
              <ChevronDown
                className={`text-text-secondary h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>
            {isOpen && (
              <div className="text-text-secondary px-4 pb-4 text-sm">
                <span className="text-text-primary font-medium">A:</span> {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
