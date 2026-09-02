import { Sparkles } from "lucide-react";

import { OptimizePlanButton } from "@/components/study-plan/optimize-plan-button";
import type { PlanHealth } from "@/lib/study-plan/health";

export function StudyPlanHealthCard({
  health,
  subjectIdsNeedingOptimization,
}: {
  health: PlanHealth;
  subjectIdsNeedingOptimization: string[];
}) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-accent-primary h-4 w-4" strokeWidth={2} />
        <h2 className="text-text-primary text-sm font-semibold">Study Plan Health</h2>
      </div>
      <p className="text-text-primary text-sm font-medium">{health.headline}</p>
      {health.detail.length > 0 && (
        <ul className="text-text-secondary flex flex-col gap-1 text-xs">
          {health.detail.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {health.hasIssues && <OptimizePlanButton subjectIds={subjectIdsNeedingOptimization} />}
    </div>
  );
}
