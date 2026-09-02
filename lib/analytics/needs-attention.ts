import type { SubjectBreakdown, WeakTopic } from "@/lib/analytics/compute";

export type AttentionPriority = "high" | "medium" | "low";

export interface NeedsAttentionRow {
  topicId: string;
  topicTitle: string;
  subjectName: string;
  subjectSlug: string;
  topicSlug: string | null;
  priority: AttentionPriority;
  reason: string;
}

const EXAM_SOON_DAYS = 14;
const REASON_EXAM_WINDOW_DAYS = 30;
const HIGH_OVERDUE_DAYS = 14;
const MEDIUM_OVERDUE_DAYS = 5;

function computePriority(
  daysOverdue: number,
  difficulty: WeakTopic["difficulty"],
  daysUntilExam: number | null,
): AttentionPriority {
  const examSoon = daysUntilExam !== null && daysUntilExam <= EXAM_SOON_DAYS;
  if (difficulty === "hard" || examSoon || daysOverdue >= HIGH_OVERDUE_DAYS) return "high";
  if (difficulty === "medium" || daysOverdue >= MEDIUM_OVERDUE_DAYS) return "medium";
  return "low";
}

function computeReason(daysOverdue: number, daysUntilExam: number | null): string {
  if (daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= REASON_EXAM_WINDOW_DAYS) {
    return `Exam in ${daysUntilExam} day${daysUntilExam === 1 ? "" : "s"}`;
  }
  return `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`;
}

export function buildNeedsAttentionRows(
  weakTopics: WeakTopic[],
  subjects: SubjectBreakdown[],
  topicSlugById: Map<string, string>,
): NeedsAttentionRow[] {
  const subjectById = new Map(subjects.map((s) => [s.subjectId, s]));

  return weakTopics.map((topic) => {
    const daysUntilExam = subjectById.get(topic.subjectId)?.daysUntilExam ?? null;
    return {
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      subjectName: topic.subjectName,
      subjectSlug: topic.subjectSlug,
      topicSlug: topicSlugById.get(topic.topicId) ?? null,
      priority: computePriority(topic.daysOverdue, topic.difficulty, daysUntilExam),
      reason: computeReason(topic.daysOverdue, daysUntilExam),
    };
  });
}
