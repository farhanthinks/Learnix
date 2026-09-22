import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { formatRelativeTime } from "@/lib/format";
import type { TopicDifficulty } from "@/types/database";

export interface SubjectTopicQuizRowData {
  topicId: string;
  topicTitle: string;
  difficulty: TopicDifficulty;
  questionCount: number | null;
  bestPercentage: number | null;
  lastAttemptAt: string | null;
  hasIncomplete: boolean;
}

export function SubjectTopicQuizRow({ topic }: { topic: SubjectTopicQuizRowData }) {
  const label = topic.hasIncomplete
    ? "Continue"
    : topic.bestPercentage !== null
      ? "Retake"
      : "Start Quiz";

  const details = [
    topic.questionCount !== null ? `${topic.questionCount} Questions` : "Not generated yet",
    topic.bestPercentage !== null ? `Best ${topic.bestPercentage}%` : null,
    topic.lastAttemptAt ? `Last attempt ${formatRelativeTime(topic.lastAttemptAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="hover:bg-surface-raised flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-sm font-medium">{topic.topicTitle}</p>
        <p className="text-text-secondary truncate text-xs">{details}</p>
      </div>
      <DifficultyBadge difficulty={topic.difficulty} />
      <StartQuizButton
        target={{ mode: "topic", topicId: topic.topicId }}
        label={label}
        variant={label === "Start Quiz" ? "primary" : "outline"}
      />
    </div>
  );
}
