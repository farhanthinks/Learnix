"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import type { TopicNotesData } from "@/components/answer-book/answer-book-shell";

export function GenerateNotesPrompt({
  topicId,
  onGenerated,
}: {
  topicId: string;
  onGenerated: (notes: TopicNotesData) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/notes`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate notes.");
        return;
      }
      onGenerated({
        content: json.notes.content,
        summary: json.notes.summary,
        keyPoints: json.notes.key_points ?? [],
        examples: json.notes.examples,
        qa: json.notes.qa ?? [],
        textbookReferences: json.notes.textbook_references ?? [],
        generatedAt: json.notes.generated_at,
        isSaved: json.notes.is_saved ?? false,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Sparkles className="text-accent-primary h-7 w-7" strokeWidth={1.5} />
      <p className="text-text-primary text-sm font-semibold">
        AI notes haven&apos;t been generated yet.
      </p>
      <FormError message={error ?? undefined} />
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-auto px-5"
      >
        {isGenerating ? "Generating..." : "Generate Study Notes"}
      </Button>
      {isGenerating && (
        <p className="text-text-secondary text-xs">This usually takes 15-30 seconds.</p>
      )}
    </div>
  );
}
