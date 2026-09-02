import { Sparkles } from "lucide-react";

import { GeneratePlanButton } from "@/components/subjects/generate-plan-button";

export interface SubjectNeedingPlan {
  id: string;
  name: string;
}

export function GeneratePlanPrompt({ subjects }: { subjects: SubjectNeedingPlan[] }) {
  if (subjects.length === 0) return null;

  return (
    <div className="border-accent-primary/30 bg-accent-primary/5 flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-accent-primary h-4 w-4" strokeWidth={2} />
        <h2 className="text-text-primary text-sm font-semibold">Create Your Study Plan</h2>
      </div>
      <p className="text-text-secondary text-sm">
        Your syllabus is ready. AI can create a personalized schedule based on exam date, available
        study hours, topic difficulty, and remaining topics.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-text-secondary text-xs">{s.name}</span>
            <GeneratePlanButton subjectId={s.id} hasExistingPlan={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
