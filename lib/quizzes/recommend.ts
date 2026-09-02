import type { TopicDifficulty } from "@/types/database";

const WEAK_THRESHOLD_PERCENT = 60;
const DEFAULT_QUESTION_COUNT_ESTIMATE = 8;

export interface TopicPerf {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  subjectName: string;
  subjectSlug: string;
  difficulty: TopicDifficulty;
  questionCount: number | null;
  bestPercentage: number | null;
  recentlyStudied: boolean;
}

export type RecommendReason = "weak" | "recent" | "uncompleted";

export interface RecommendedQuiz {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  subjectName: string;
  subjectSlug: string;
  difficulty: TopicDifficulty;
  questionCount: number;
  reason: RecommendReason;
}

/**
 * Ranks topics for the "Recommended for You" rail: weak scores first (most
 * in need of practice), then topics studied recently but never quizzed, then
 * any other never-attempted topic — so the list favors relevance over just
 * listing everything alphabetically.
 */
export function computeRecommendedQuizzes(topics: TopicPerf[], limit: number): RecommendedQuiz[] {
  function toRecommendation(t: TopicPerf, reason: RecommendReason): RecommendedQuiz {
    return {
      topicId: t.topicId,
      topicSlug: t.topicSlug,
      topicTitle: t.topicTitle,
      subjectName: t.subjectName,
      subjectSlug: t.subjectSlug,
      difficulty: t.difficulty,
      questionCount: t.questionCount ?? DEFAULT_QUESTION_COUNT_ESTIMATE,
      reason,
    };
  }

  const weak = topics
    .filter((t) => t.bestPercentage !== null && t.bestPercentage < WEAK_THRESHOLD_PERCENT)
    .sort((a, b) => (a.bestPercentage ?? 0) - (b.bestPercentage ?? 0))
    .map((t) => toRecommendation(t, "weak"));

  const recentUncompleted = topics
    .filter((t) => t.bestPercentage === null && t.recentlyStudied)
    .map((t) => toRecommendation(t, "recent"));

  const otherUncompleted = topics
    .filter((t) => t.bestPercentage === null && !t.recentlyStudied)
    .map((t) => toRecommendation(t, "uncompleted"));

  const seen = new Set<string>();
  const ranked: RecommendedQuiz[] = [];
  for (const rec of [...weak, ...recentUncompleted, ...otherUncompleted]) {
    if (seen.has(rec.topicId)) continue;
    seen.add(rec.topicId);
    ranked.push(rec);
    if (ranked.length >= limit) break;
  }
  return ranked;
}

export function isWeakTopic(percentage: number): boolean {
  return percentage < WEAK_THRESHOLD_PERCENT;
}
