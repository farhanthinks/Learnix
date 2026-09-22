import { toMinutes } from "@/lib/scheduling/slot-conflict";
import type { StudyDay, TopicDifficulty } from "@/types/database";

export interface TopicForScheduling {
  id: string;
  unit_no: number | null;
  difficulty: TopicDifficulty;
  subtopics: string[] | null;
}

export interface BreakPreferences {
  enabled: boolean;
  minutes: number;
  frequency: number; // insert a break after every `frequency` sessions
}

export const NO_BREAKS: BreakPreferences = { enabled: false, minutes: 0, frequency: 1 };

export interface PlannedSession {
  topic_id: string;
  scheduled_date: string; // YYYY-MM-DD
  planned_minutes: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface PlannedBreak {
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

export interface GeneratePlanResult {
  sessions?: PlannedSession[];
  breaks?: PlannedBreak[];
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

function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

/** How many breaks land on a day with this many chained sessions — one after
 * every `frequency`-th session, never a trailing break after the last one. */
function breaksForSessionCount(sessionCount: number, breaks: BreakPreferences): number {
  if (!breaks.enabled || sessionCount <= 1) return 0;
  return Math.floor((sessionCount - 1) / breaks.frequency);
}

/**
 * Deterministic, rules-based scheduler (no AI involved):
 *
 * 1. Every topic is worth some number of "effort units" (see effortUnits).
 * 2. Units are laid out across the available days via a running prefix sum,
 *    so the cumulative unit count is spread evenly and proportionally —
 *    a topic worth 3 units naturally spans more of the timeline (and often
 *    more distinct days) than a 1-unit topic.
 * 3. Whatever units land on the same day split that day's study-minutes
 *    budget between them — reduced up front by however many breaks that
 *    day will need, so the day's chained sessions-plus-breaks still fit
 *    inside `dailyStudyMinutes`.
 * 4. Units for the same topic that land on the same day are merged into a
 *    single study_plans row.
 * 5. Each day's merged sessions are then chained sequentially starting at
 *    `dayStartTime`, with a break inserted after every `frequency`-th
 *    session (never after the last one that day) when breaks are enabled.
 *
 * Topics are processed in unit_no order so the plan roughly follows the
 * syllabus's own sequence, and that same order drives same-day chaining.
 */
export function generateStudyPlan(
  topics: TopicForScheduling[],
  availableDays: Date[],
  dailyStudyMinutes: number,
  dayStartTime: string = "18:00",
  breakPrefs: BreakPreferences = NO_BREAKS,
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
  const distinctTopicsPerDay = new Map<number, Set<string>>();
  for (const a of dayAssignments) {
    unitsPerDayIndex.set(a.dayIndex, (unitsPerDayIndex.get(a.dayIndex) ?? 0) + 1);
    const set = distinctTopicsPerDay.get(a.dayIndex) ?? new Set<string>();
    set.add(a.topicId);
    distinctTopicsPerDay.set(a.dayIndex, set);
  }

  const adjustedMinutesPerDay = new Map<number, number>();
  for (const [dayIndex, topicSet] of distinctTopicsPerDay) {
    const sessionCount = topicSet.size;
    const breaksCount = breaksForSessionCount(sessionCount, breakPrefs);
    const breakMinutesTotal = breaksCount * breakPrefs.minutes;
    adjustedMinutesPerDay.set(
      dayIndex,
      Math.max(dailyStudyMinutes - breakMinutesTotal, sessionCount * MIN_SESSION_MINUTES),
    );
  }

  const grouped = new Map<string, { topicId: string; dayIndex: number; minutes: number }>();
  for (const a of dayAssignments) {
    const dayUnitCount = unitsPerDayIndex.get(a.dayIndex) ?? 1;
    const dayMinutesBudget = adjustedMinutesPerDay.get(a.dayIndex) ?? dailyStudyMinutes;
    const perUnitMinutes = Math.max(
      MIN_SESSION_MINUTES,
      Math.round(dayMinutesBudget / dayUnitCount),
    );
    const key = `${a.topicId}|${a.dayIndex}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.minutes += perUnitMinutes;
    } else {
      grouped.set(key, { topicId: a.topicId, dayIndex: a.dayIndex, minutes: perUnitMinutes });
    }
  }

  const sessionsByDay = new Map<number, { topicId: string; minutes: number }[]>();
  for (const chunk of grouped.values()) {
    const list = sessionsByDay.get(chunk.dayIndex) ?? [];
    list.push({ topicId: chunk.topicId, minutes: chunk.minutes });
    sessionsByDay.set(chunk.dayIndex, list);
  }

  const sessions: PlannedSession[] = [];
  const breaksOut: PlannedBreak[] = [];
  const dayStartMinutes = toMinutes(dayStartTime);

  for (const [dayIndex, dayChunks] of sessionsByDay) {
    const dateStr = toDateString(availableDays[dayIndex]);
    let cursor = dayStartMinutes;

    dayChunks.forEach((chunk, i) => {
      const start = cursor;
      const end = start + chunk.minutes;
      sessions.push({
        topic_id: chunk.topicId,
        scheduled_date: dateStr,
        planned_minutes: chunk.minutes,
        start_time: minutesToTime(start),
        end_time: minutesToTime(end),
      });
      cursor = end;

      const isLast = i === dayChunks.length - 1;
      if (breakPrefs.enabled && !isLast && (i + 1) % breakPrefs.frequency === 0) {
        const breakStart = cursor;
        const breakEnd = breakStart + breakPrefs.minutes;
        breaksOut.push({
          scheduled_date: dateStr,
          start_time: minutesToTime(breakStart),
          end_time: minutesToTime(breakEnd),
        });
        cursor = breakEnd;
      }
    });
  }

  return { sessions, breaks: breaksOut };
}
