import { Clock3, ListChecks, Trophy } from "lucide-react";

import { StartQuizButton } from "@/components/quizzes/start-quiz-button";

export interface MockTestCardData {
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  questionCount: number;
  timeLimitMinutes: number;
  bestPercentage: number | null;
  generated: boolean;
}

export function MockTestCard({ test }: { test: MockTestCardData }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <div>
        <p className="text-accent-primary text-xs font-semibold tracking-wide uppercase">
          Mock Test
        </p>
        <h3 className="text-text-primary mt-1 text-base font-semibold">
          {test.subjectName} Mock Test
        </h3>
      </div>

      <div className="text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" strokeWidth={2} />
          {test.questionCount} Questions
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-4 w-4" strokeWidth={2} />
          {test.timeLimitMinutes} Minutes
        </span>
        <span className="bg-surface-raised rounded-full px-2 py-0.5 text-xs font-medium">
          Full syllabus
        </span>
      </div>

      {test.bestPercentage !== null && (
        <p className="text-text-secondary flex items-center gap-1.5 text-xs">
          <Trophy className="text-accent-warning h-3.5 w-3.5" strokeWidth={2} />
          Best score: {test.bestPercentage}%
        </p>
      )}

      <StartQuizButton
        target={{ mode: "mock", subjectId: test.subjectId }}
        label={test.generated ? "Retake Mock Test" : "Start Mock Test"}
        loadingLabel="Preparing mock test..."
        fullWidth
      />
    </div>
  );
}
