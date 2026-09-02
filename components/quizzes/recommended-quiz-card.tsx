import { AlertTriangle, Clock3, Sparkles } from "lucide-react";

import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import type { RecommendReason, RecommendedQuiz } from "@/lib/quizzes/recommend";

const REASON_META: Record<RecommendReason, { label: string; icon: typeof Sparkles }> = {
  weak: { label: "Weak area", icon: AlertTriangle },
  recent: { label: "Recently studied", icon: Clock3 },
  uncompleted: { label: "Not attempted yet", icon: Sparkles },
};

export function RecommendedQuizCard({ quiz }: { quiz: RecommendedQuiz }) {
  const meta = REASON_META[quiz.reason];
  const Icon = meta.icon;

  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs font-medium">{quiz.subjectName}</span>
        <span className="text-accent-primary flex items-center gap-1 text-xs font-medium">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          {meta.label}
        </span>
      </div>
      <p className="text-text-primary text-sm font-semibold">{quiz.topicTitle} Quiz</p>
      <div className="flex items-center gap-2">
        <span className="text-text-secondary text-xs">{quiz.questionCount} Questions</span>
        <span className="text-text-secondary text-xs">·</span>
        <DifficultyBadge difficulty={quiz.difficulty} />
      </div>
      <StartQuizButton
        target={{ mode: "topic", topicId: quiz.topicId }}
        label="Start Quiz"
        fullWidth
      />
    </div>
  );
}
