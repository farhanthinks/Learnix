"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

export interface Flashcard {
  front: string;
  back: string;
}

export function FlashcardsModal({ cards, onClose }: { cards: Flashcard[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  function next() {
    setFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Flashcards"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface flex w-full max-w-md flex-col gap-4 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-text-primary text-sm font-semibold">Flashcards</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="text-text-secondary py-10 text-center text-sm">
            Not enough generated content to build flashcards yet.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="border-border bg-surface-raised flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center"
            >
              <span className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                {flipped ? "Answer" : "Question"}
              </span>
              <span className="text-text-primary text-base font-medium">
                {flipped ? card.back : card.front}
              </span>
              <span className="text-text-secondary mt-2 text-xs">Tap to flip</span>
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                aria-label="Previous card"
                className="text-text-secondary hover:bg-surface-raised flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <span className="text-text-secondary text-xs font-medium">
                {index + 1} / {cards.length}
              </span>
              <button
                type="button"
                onClick={next}
                disabled={index === cards.length - 1}
                aria-label="Next card"
                className="text-text-secondary hover:bg-surface-raised flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
