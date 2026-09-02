import type { TopicDifficulty, TopicStatus } from "@/types/database";

export interface HealthOccurrence {
  date: string; // YYYY-MM-DD
  status: TopicStatus;
}

export interface HealthTopic {
  status: TopicStatus;
  difficulty: TopicDifficulty;
}

export interface HealthSubject {
  name: string;
  examDate: string | null;
}

export interface PlanHealth {
  headline: string;
  detail: string[];
  suggestionMinutes: number | null;
  hasIssues: boolean;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * A deterministic, rules-based read on the plan's state — same philosophy
 * as the (also non-AI) scheduler itself: missed *scheduled occurrences*
 * (session-level, since a topic can span several sessions) and pending
 * *hard topics* (topic-level, so a multi-session topic isn't double
 * counted), plus how close the nearest exam is, turned into a short
 * recommendation rather than raw stats.
 */
export function computeStudyPlanHealth(
  occurrences: HealthOccurrence[],
  topics: HealthTopic[],
  subjects: HealthSubject[],
  todayIso: string,
): PlanHealth {
  const missed = occurrences.filter((o) => o.date < todayIso && o.status !== "done");
  const pendingHard = topics.filter((t) => t.status !== "done" && t.difficulty === "hard");

  const upcomingExamDays = subjects
    .map((s) => (s.examDate ? daysBetween(todayIso, s.examDate) : null))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestExamDays = upcomingExamDays.length > 0 ? Math.min(...upcomingExamDays) : null;

  const detail: string[] = [];
  let headline: string;
  let suggestionMinutes: number | null = null;

  if (missed.length === 0 && pendingHard.length === 0) {
    headline = "You're doing great! Keep going.";
  } else if (missed.length > 0) {
    headline = `You're slightly behind — ${missed.length} missed session${missed.length === 1 ? "" : "s"}.`;
    suggestionMinutes = Math.min(60, missed.length * 15);
  } else {
    headline = `You have ${pendingHard.length} difficult topic${pendingHard.length === 1 ? "" : "s"} pending.`;
    suggestionMinutes = 30;
  }

  if (missed.length > 0 && pendingHard.length > 0) {
    detail.push(
      `You have ${pendingHard.length} difficult topic${pendingHard.length === 1 ? "" : "s"} pending.`,
    );
  }
  if (
    nearestExamDays !== null &&
    nearestExamDays <= 7 &&
    (missed.length > 0 || pendingHard.length > 0)
  ) {
    detail.push(
      `Your nearest exam is in ${nearestExamDays} day${nearestExamDays === 1 ? "" : "s"} — consider prioritizing it.`,
    );
  }
  if (suggestionMinutes !== null) {
    detail.push(`AI recommends adding ${suggestionMinutes} minutes tomorrow.`);
  }

  return {
    headline,
    detail,
    suggestionMinutes,
    hasIssues: missed.length > 0 || pendingHard.length > 0,
  };
}
