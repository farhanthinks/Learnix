import type { TopicDifficulty } from "@/types/database";

const STYLES: Record<TopicDifficulty, string> = {
  easy: "bg-accent-success/15 text-accent-success",
  medium: "bg-accent-warning/15 text-accent-warning",
  hard: "bg-accent-danger/15 text-accent-danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: TopicDifficulty }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
