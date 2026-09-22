import type { CalendarEventType, TopicDifficulty } from "@/types/database";
import type { CalendarSession } from "@/lib/calendar/session";

export const TYPE_LABELS: Record<CalendarEventType, string> = {
  study: "Study",
  revision: "Revision",
  practice: "Practice",
  exam: "Exam",
  other: "Other",
  break: "Break",
};

export const DIFFICULTY_LABELS: Record<TopicDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export interface SessionColorClasses {
  dot: string;
  bg: string;
  text: string;
  border: string;
}

const EASY: SessionColorClasses = {
  dot: "bg-accent-success",
  bg: "bg-accent-success/10",
  text: "text-accent-success",
  border: "border-accent-success/30",
};
const MEDIUM: SessionColorClasses = {
  dot: "bg-accent-warning",
  bg: "bg-accent-warning/10",
  text: "text-accent-warning",
  border: "border-accent-warning/30",
};
const HARD: SessionColorClasses = {
  dot: "bg-accent-danger",
  bg: "bg-accent-danger/10",
  text: "text-accent-danger",
  border: "border-accent-danger/30",
};
const REVISION: SessionColorClasses = {
  dot: "bg-purple-500",
  bg: "bg-purple-500/10",
  text: "text-purple-600",
  border: "border-purple-500/30",
};
const PRACTICE: SessionColorClasses = {
  dot: "bg-cyan-500",
  bg: "bg-cyan-500/10",
  text: "text-cyan-600",
  border: "border-cyan-500/30",
};
const NEUTRAL: SessionColorClasses = {
  dot: "bg-text-secondary",
  bg: "bg-text-secondary/10",
  text: "text-text-secondary",
  border: "border-border",
};

/**
 * Exams always read as high-stakes (hard/red) regardless of difficulty;
 * revision and practice are their own semantic categories; everything else
 * (study/other) falls back to the topic's difficulty color, or neutral gray
 * when there isn't one.
 */
export function getSessionColor(
  session: Pick<CalendarSession, "type" | "difficulty">,
): SessionColorClasses {
  if (session.type === "exam") return HARD;
  if (session.type === "revision") return REVISION;
  if (session.type === "practice") return PRACTICE;
  if (session.difficulty === "easy") return EASY;
  if (session.difficulty === "medium") return MEDIUM;
  if (session.difficulty === "hard") return HARD;
  return NEUTRAL;
}

export const LEGEND_ITEMS: { label: string; classes: SessionColorClasses }[] = [
  { label: "Easy", classes: EASY },
  { label: "Medium", classes: MEDIUM },
  { label: "Hard", classes: HARD },
  { label: "Revision", classes: REVISION },
  { label: "Practice", classes: PRACTICE },
];
