import type { StudyDay, TopicDifficulty } from "@/types/database";

export interface TopicForScheduling {
  id: string;
  unit_no: number | null;
  difficulty: TopicDifficulty;
  subtopics: string[] | null;
}

export interface PlannedSession {
  topic_id: string;
  scheduled_date: string; // YYYY-MM-DD
  planned_minutes: number;
}

export interface GeneratePlanResult {
  sessions?: PlannedSession[];
  error?: string;
}

const DIFFICULTY_WEIGHT: Record<TopicDifficulty, number> = { easy: 1, medium: 2, hard: 3 };
const MIN_SESSION_MINUTES = 15;
const DAY_LABELS: StudyDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Study days from `startDate` up to (but not including) `examDate`, filtered
 * to the user's preferred weekdays. The exam day itself is left free.
 */
export function getAvailableStudyDays(
  startDate: Date,
  examDate: Date,
  studyDays: StudyDay[],
): Date[] {
  const days: Date[] = [];
  const cur = toDateOnly(startDate);
  const end = toDateOnly(examDate);

  while (cur < end) {
    if (studyDays.includes(DAY_LABELS[cur.getDay()])) {
      days.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

/**
 * "Units of effort" for a topic: easy = 1, medium = 2, hard = 3, plus a
 * small bump for topics with a lot of subtopics (every 3 subtopics = +1
 * unit, capped at +2 so one dense topic can't dominate the whole plan).
 */
function effortUnits(topic: TopicForScheduling): number {
  const base = DIFFICULTY_WEIGHT[topic.difficulty] ?? DIFFICULTY_WEIGHT.medium;
  const subtopicBonus = Math.min(2, Math.floor((topic.subtopics?.length ?? 0) / 3));
  return base + subtopicBonus;
}

/**
 * Deterministic, rules-based scheduler (no AI involved):
 *
 * 1. Every topic is worth some number of "effort units" (see effortUnits).
 * 2. Units are laid out across the available days via a running prefix sum,
 *    so the cumulative unit count is spread evenly and proportionally —
 *    a topic worth 3 units naturally spans more of the timeline (and often
 *    more distinct days) than a 1-unit topic.
 * 3. Whatever units land on the same day split that day's
 *    `dailyStudyMinutes` between them, so a day's total stays close to what
 *    the user said they have available, and units for the harder topic on
 *    that day still take a proportionally bigger slice.
 * 4. Units for the same topic that land on the same day are merged into a
 *    single study_plans row.
 *
 * Topics are processed in unit_no order so the plan roughly follows the
 * syllabus's own sequence.
 */
export function generateStudyPlan(
  topics: TopicForScheduling[],
  availableDays: Date[],
  dailyStudyMinutes: number,
): GeneratePlanResult {
  if (availableDays.length === 0) {
    return { error: "There aren't enough study days before the exam date to generate a plan." };
  }
  if (topics.length === 0) {
    return { error: "This subject has no extracted topics yet." };
  }

  const orderedTopics = [...topics].sort((a, b) => (a.unit_no ?? 0) - (b.unit_no ?? 0));
  const totalUnits = orderedTopics.reduce((sum, t) => sum + effortUnits(t), 0);
  const unitsPerDay = totalUnits / availableDays.length;

  const dayAssignments: { topicId: string; dayIndex: number }[] = [];
  let runningUnits = 0;
  for (const topic of orderedTopics) {
    const units = effortUnits(topic);
    for (let i = 0; i < units; i++) {
      const dayIndex = Math.min(Math.floor(runningUnits / unitsPerDay), availableDays.length - 1);
      dayAssignments.push({ topicId: topic.id, dayIndex });
      runningUnits += 1;
    }
  }

  const unitsPerDayIndex = new Map<number, number>();
  for (const a of dayAssignments) {
    unitsPerDayIndex.set(a.dayIndex, (unitsPerDayIndex.get(a.dayIndex) ?? 0) + 1);
  }

  const grouped = new Map<string, PlannedSession>();
  for (const a of dayAssignments) {
    const dayUnitCount = unitsPerDayIndex.get(a.dayIndex) ?? 1;
    const perUnitMinutes = Math.max(
      MIN_SESSION_MINUTES,
      Math.round(dailyStudyMinutes / dayUnitCount),
    );
    const key = `${a.topicId}|${a.dayIndex}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.planned_minutes += perUnitMinutes;
    } else {
      grouped.set(key, {
        topic_id: a.topicId,
        scheduled_date: toDateString(availableDays[a.dayIndex]),
        planned_minutes: perUnitMinutes,
      });
    }
  }

  return { sessions: Array.from(grouped.values()) };
}
