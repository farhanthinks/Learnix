"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function OptimizePlanButton({ subjectIds }: { subjectIds: string[] }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (subjectIds.length === 0) return null;

  async function handleClick() {
    setError(null);
    setIsRunning(true);
    for (const id of subjectIds) {
      try {
        const res = await fetch(`/api/subjects/${id}/plan/rebalance`, { method: "POST" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Could not optimize your plan.");
          break;
        }
      } catch {
        setError("Network error while optimizing. Please try again.");
        break;
      }
    }
    setIsRunning(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isRunning}
        className="w-auto gap-1.5 px-4"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        {isRunning ? "Optimizing..." : "Optimize My Plan"}
      </Button>
      {error && <p className="text-accent-danger text-xs">{error}</p>}
    </div>
  );
}
