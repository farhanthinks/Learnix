"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GeneratePlanButton({
  subjectId,
  hasExistingPlan,
  disabledReason,
}: {
  subjectId: string;
  hasExistingPlan: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (hasExistingPlan) {
      const confirmed = window.confirm(
        "This will replace your existing study plan for this subject. Continue?",
      );
      if (!confirmed) return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/plan`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate a plan.");
        setIsGenerating(false);
        return;
      }
      router.push("/dashboard/study-plan");
    } catch {
      setError("Network error. Please try again.");
      setIsGenerating(false);
    }
  }

  if (disabledReason) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" variant="outline" className="w-auto px-4" disabled>
          Generate Study Plan
        </Button>
        <p className="text-text-secondary text-xs">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" className="w-auto px-4" onClick={handleClick} disabled={isGenerating}>
        {isGenerating
          ? "Generating..."
          : hasExistingPlan
            ? "Regenerate Study Plan"
            : "Generate Study Plan"}
      </Button>
      {error && <p className="text-accent-danger text-xs">{error}</p>}
    </div>
  );
}
