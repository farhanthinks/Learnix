import { FileQuestion } from "lucide-react";

import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import type { TopicDifficulty } from "@/types/database";

export interface TopicQuizRowData {
  topicId: string;
  topicTitle: string;
  subjectName: string;
  subjectSlug: string;
  difficulty: TopicDifficulty;
  questionCount: number | null;
  bestPercentage: number | null;
}

export function TopicQuizRow({
  quiz,
  showSubject = false,
}: {
  quiz: TopicQuizRowData;
  showSubject?: boolean;
}) {
  const generated = quiz.questionCount !== null;

  return (
    <div className="hover:bg-surface-raised group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors">
      <span className="bg-accent-primary/10 text-accent-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <FileQuestion className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-sm font-medium">{quiz.topicTitle}</p>
        <p className="text-text-secondary truncate text-xs">
          {showSubject ? `${quiz.subjectName} · ` : ""}
          {generated ? `${quiz.questionCount} Questions` : "Not generated yet"}
          {quiz.bestPercentage !== null ? ` · Best ${quiz.bestPercentage}%` : ""}
        </p>
      </div>
      <DifficultyBadge difficulty={quiz.difficulty} />
      <StartQuizButton
        target={{ mode: "topic", topicId: quiz.topicId }}
        label={generated ? "Retake" : "Start Quiz"}
        variant={generated ? "outline" : "primary"}
      />
    </div>
  );
}
