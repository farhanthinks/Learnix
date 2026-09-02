import type { TopicDifficulty } from "@/types/database";

export interface AnalyticsSubjectInput {
  id: string;
  slug: string;
  name: string;
  exam_date: string | null;
}

export interface AnalyticsTopicInput {
  id: string;
  subject_id: string;
  title: string;
  difficulty: TopicDifficulty;
  status: "pending" | "in_progress" | "done";
}

export interface AnalyticsPlanInput {
  topic_id: string;
  scheduled_date: string;
}

export interface AnalyticsSessionInput {
  topic_id: string;
  started_at: string;
  duration_minutes: number | null;
}

export interface SubjectBreakdown {
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  topicsDone: number;
  topicsTotal: number;
  percentComplete: number;
  minutesSpent: number;
  daysUntilExam: number | null;
}

export interface WeeklyPoint {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface WeakTopic {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  difficulty: TopicDifficulty;
  scheduledDate: string;
  daysOverdue: number;
}

export interface AnalyticsResult {
  overview: {
    topicsDone: number;
    topicsTotal: number;
    percentComplete: number;
    weekMinutes: number;
  };
  subjects: SubjectBreakdown[];
  weekly: WeeklyPoint[];
  weakTopics: WeakTopic[];
}

const DIFFICULTY_RANK: Record<TopicDifficulty, number> = { hard: 0, medium: 1, easy: 2 };
const WEAK_TOPICS_LIMIT = 20;

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`);
  const to = new Date(`${toDateStr}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Pure aggregation over already-fetched, RLS-scoped rows — no DB access here,
 * so this is fully unit-testable. Session timestamps are bucketed by their
 * UTC calendar date: the app doesn't collect the student's IANA timezone
 * anywhere (same constraint as the .ics export in Part 4), so this is the
 * only deterministic, server-independent bucketing available.
 */
export function computeAnalytics(
  subjects: AnalyticsSubjectInput[],
  topics: AnalyticsTopicInput[],
  plans: AnalyticsPlanInput[],
  sessions: AnalyticsSessionInput[],
  today: Date = new Date(),
): AnalyticsResult {
  const todayStr = toDateString(today);

  const topicsBySubject = new Map<string, AnalyticsTopicInput[]>();
  for (const topic of topics) {
    if (!topicsBySubject.has(topic.subject_id)) topicsBySubject.set(topic.subject_id, []);
    topicsBySubject.get(topic.subject_id)!.push(topic);
  }

  const topicById = new Map(topics.map((t) => [t.id, t]));

  const minutesByTopic = new Map<string, number>();
  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const minutes = session.duration_minutes ?? 0;
    minutesByTopic.set(session.topic_id, (minutesByTopic.get(session.topic_id) ?? 0) + minutes);

    const day = session.started_at.slice(0, 10);
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + minutes);
  }

  const minutesBySubject = new Map<string, number>();
  for (const topic of topics) {
    const minutes = minutesByTopic.get(topic.id) ?? 0;
    minutesBySubject.set(topic.subject_id, (minutesBySubject.get(topic.subject_id) ?? 0) + minutes);
  }

  const subjectBreakdowns: SubjectBreakdown[] = subjects.map((subject) => {
    const subjectTopics = topicsBySubject.get(subject.id) ?? [];
    const topicsTotal = subjectTopics.length;
    const topicsDone = subjectTopics.filter((t) => t.status === "done").length;

    return {
      subjectId: subject.id,
      subjectSlug: subject.slug,
      subjectName: subject.name,
      topicsDone,
      topicsTotal,
      percentComplete: topicsTotal === 0 ? 0 : Math.round((topicsDone / topicsTotal) * 100),
      minutesSpent: minutesBySubject.get(subject.id) ?? 0,
      daysUntilExam: subject.exam_date ? daysBetween(todayStr, subject.exam_date) : null,
    };
  });

  const topicsDone = topics.filter((t) => t.status === "done").length;
  const topicsTotal = topics.length;

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push(toDateString(d));
  }
  const weekly: WeeklyPoint[] = last7Days.map((date) => ({
    date,
    minutes: minutesByDay.get(date) ?? 0,
  }));
  const weekMinutes = weekly.reduce((sum, w) => sum + w.minutes, 0);

  const earliestOverdueByTopic = new Map<string, string>();
  for (const plan of plans) {
    if (plan.scheduled_date >= todayStr) continue;
    const topic = topicById.get(plan.topic_id);
    if (!topic || topic.status !== "pending") continue;

    const existing = earliestOverdueByTopic.get(plan.topic_id);
    if (!existing || plan.scheduled_date < existing) {
      earliestOverdueByTopic.set(plan.topic_id, plan.scheduled_date);
    }
  }

  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  const weakTopicCandidates = Array.from(earliestOverdueByTopic.entries()).map(
    ([topicId, scheduledDate]) => {
      const topic = topicById.get(topicId)!;
      const subject = subjectById.get(topic.subject_id);
      const entry: WeakTopic = {
        topicId,
        topicTitle: topic.title,
        subjectId: topic.subject_id,
        subjectSlug: subject?.slug ?? "",
        subjectName: subject?.name ?? "Unknown subject",
        difficulty: topic.difficulty,
        scheduledDate,
        daysOverdue: daysBetween(scheduledDate, todayStr),
      };
      const examUrgency = subject?.exam_date ? daysBetween(todayStr, subject.exam_date) : Infinity;
      return { entry, examUrgency };
    },
  );

  const weakTopics: WeakTopic[] = weakTopicCandidates
    .sort((a, b) => {
      const rankDiff = DIFFICULTY_RANK[a.entry.difficulty] - DIFFICULTY_RANK[b.entry.difficulty];
      if (rankDiff !== 0) return rankDiff;
      if (a.examUrgency !== b.examUrgency) return a.examUrgency - b.examUrgency;
      return b.entry.daysOverdue - a.entry.daysOverdue;
    })
    .slice(0, WEAK_TOPICS_LIMIT)
    .map((c) => c.entry);

  return {
    overview: {
      topicsDone,
      topicsTotal,
      percentComplete: topicsTotal === 0 ? 0 : Math.round((topicsDone / topicsTotal) * 100),
      weekMinutes,
    },
    subjects: subjectBreakdowns,
    weekly,
    weakTopics,
  };
}

export interface TrendPoint {
  label: string; // "W1".."W4"
  percent: number;
}

const TREND_WEEKS = 4;

/**
 * Topics have no completed_at timestamp, so there's no real history of when
 * the completion rate was what — this reconstructs a plausible trend using
 * each done topic's most recent study session as a proxy for "roughly when
 * it was finished". A done topic with no session in the trend window (or no
 * session at all) is assumed to have been done before the window and counts
 * toward every week. This is an approximation, but it's anchored to real
 * data and W4 always equals today's true percentComplete exactly.
 */
export function computeCompletionTrend(
  topics: AnalyticsTopicInput[],
  sessions: AnalyticsSessionInput[],
  today: Date = new Date(),
): TrendPoint[] {
  const topicsTotal = topics.length;
  if (topicsTotal === 0) {
    return Array.from({ length: TREND_WEEKS }, (_, i) => ({ label: `W${i + 1}`, percent: 0 }));
  }

  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - TREND_WEEKS * 7);
  const windowStartStr = toDateString(windowStart);

  const lastSessionByTopic = new Map<string, string>();
  for (const s of sessions) {
    const day = s.started_at.slice(0, 10);
    const existing = lastSessionByTopic.get(s.topic_id);
    if (!existing || day > existing) lastSessionByTopic.set(s.topic_id, day);
  }

  const weekEndDates: string[] = [];
  for (let w = 1; w <= TREND_WEEKS; w++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (TREND_WEEKS - w) * 7);
    weekEndDates.push(toDateString(d));
  }

  const doneTopics = topics.filter((t) => t.status === "done");
  const doneCountThroughWeek = new Array(TREND_WEEKS).fill(0);

  for (const topic of doneTopics) {
    const lastSession = lastSessionByTopic.get(topic.id);
    if (!lastSession || lastSession <= windowStartStr) {
      for (let w = 0; w < TREND_WEEKS; w++) doneCountThroughWeek[w]++;
      continue;
    }
    const weekIndex = weekEndDates.findIndex((end) => lastSession <= end);
    const startWeek = weekIndex === -1 ? TREND_WEEKS - 1 : weekIndex;
    for (let w = startWeek; w < TREND_WEEKS; w++) doneCountThroughWeek[w]++;
  }

  return doneCountThroughWeek.map((count, i) => ({
    label: `W${i + 1}`,
    percent: Math.round((count / topicsTotal) * 100),
  }));
}

export interface MasteryBucket {
  label: string;
  count: number;
  percent: number;
}

export interface TopicMastery {
  mastered: MasteryBucket;
  inProgress: MasteryBucket;
  needsAttention: MasteryBucket;
  notStarted: MasteryBucket;
}

/**
 * Topics don't carry a continuous mastery score, so this reuses the two real
 * signals available: status, and the overdue-and-pending flag already
 * computed for weakTopics. "Needs Attention" is specifically the subset of
 * pending topics that are overdue — not just any pending topic.
 */
export function computeTopicMastery(
  topics: AnalyticsTopicInput[],
  weakTopicIds: Set<string>,
): TopicMastery {
  const total = topics.length;
  let masteredCount = 0;
  let inProgressCount = 0;
  let needsAttentionCount = 0;
  let notStartedCount = 0;

  for (const t of topics) {
    if (t.status === "done") masteredCount++;
    else if (t.status === "in_progress") inProgressCount++;
    else if (weakTopicIds.has(t.id)) needsAttentionCount++;
    else notStartedCount++;
  }

  function bucket(label: string, count: number): MasteryBucket {
    return { label, count, percent: total === 0 ? 0 : Math.round((count / total) * 100) };
  }

  return {
    mastered: bucket("Mastered", masteredCount),
    inProgress: bucket("In Progress", inProgressCount),
    needsAttention: bucket("Needs Attention", needsAttentionCount),
    notStarted: bucket("Not Started", notStartedCount),
  };
}
