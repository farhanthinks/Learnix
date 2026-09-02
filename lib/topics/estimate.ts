import type { TopicDifficulty } from "@/types/database";

// No stored per-topic duration exists yet — this derives a stable, roughly
// proportional estimate from difficulty and subtopic count (same signal the
// scheduler's effort score uses) purely for display purposes.
const BASE_MINUTES: Record<TopicDifficulty, number> = { easy: 30, medium: 45, hard: 60 };

export function estimateTopicMinutes(topic: {
  difficulty: TopicDifficulty;
  subtopics: string[] | null;
}): number {
  const bonus = Math.min(2, Math.floor((topic.subtopics?.length ?? 0) / 3)) * 15;
  return BASE_MINUTES[topic.difficulty] + bonus;
}
