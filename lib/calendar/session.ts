import type { CalendarEventType, TopicDifficulty, TopicStatus } from "@/types/database";

export type CalendarSessionSource = "plan" | "event";

export interface CalendarSession {
  /** Globally unique across both sources: "plan:<id>" or "event:<id>". */
  id: string;
  /** The underlying study_plans/calendar_events row id. */
  rawId: string;
  source: CalendarSessionSource;
  title: string;
  subjectId: string | null;
  subjectSlug: string | null;
  subjectName: string | null;
  topicId: string | null;
  topicSlug: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: CalendarEventType;
  difficulty: TopicDifficulty | null;
  status: TopicStatus;
  notes: string | null;
  /** Plan-sourced sessions borrow their subject's slot time and can only be
   * moved between days, not retimed — see the per-subject slot design. */
  timeEditable: boolean;
}

export interface PlanRowInput {
  id: string;
  scheduled_date: string;
  planned_minutes: number;
  subject_id: string;
  subject_slug: string;
  subject_name: string;
  subject_slot_start_time: string | null;
  start_time: string | null;
  end_time: string | null;
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  topic_difficulty: TopicDifficulty;
  topic_status: TopicStatus;
}

export interface EventRowInput {
  id: string;
  title: string;
  subject_id: string | null;
  subject_slug: string | null;
  subject_name: string | null;
  topic_id: string | null;
  topic_slug: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  event_type: CalendarEventType;
  difficulty: TopicDifficulty | null;
  status: TopicStatus;
  notes: string | null;
}

const FALLBACK_START_TIME = "18:00";
const MINUTES_IN_DAY = 24 * 60;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function formatDurationLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  return minutesToTime(toMinutes(hhmm) + minutes);
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}:00 ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function planRowToSession(row: PlanRowInput): CalendarSession {
  // Newer rows carry their own chained start/end time (see generate-plan.ts);
  // older rows predate that and fall back to the subject's slot start, same
  // as before — every same-day row independently "starting" there, which is
  // only accurate when a day has just one row.
  const start =
    row.start_time?.slice(0, 5) ?? (row.subject_slot_start_time ?? FALLBACK_START_TIME).slice(0, 5);
  const end = row.end_time?.slice(0, 5) ?? addMinutesToTime(start, row.planned_minutes);
  return {
    id: `plan:${row.id}`,
    rawId: row.id,
    source: "plan",
    title: row.topic_title,
    subjectId: row.subject_id,
    subjectSlug: row.subject_slug,
    subjectName: row.subject_name,
    topicId: row.topic_id,
    topicSlug: row.topic_slug,
    date: row.scheduled_date,
    startTime: start,
    endTime: end,
    type: "study",
    difficulty: row.topic_difficulty,
    status: row.topic_status,
    notes: null,
    timeEditable: false,
  };
}

export function eventRowToSession(row: EventRowInput): CalendarSession {
  return {
    id: `event:${row.id}`,
    rawId: row.id,
    source: "event",
    title: row.title,
    subjectId: row.subject_id,
    subjectSlug: row.subject_slug,
    subjectName: row.subject_name,
    topicId: row.topic_id,
    topicSlug: row.topic_slug,
    date: row.scheduled_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    type: row.event_type,
    difficulty: row.difficulty,
    status: row.status,
    notes: row.notes,
    timeEditable: true,
  };
}

export function mergeSessions(
  planRows: PlanRowInput[],
  eventRows: EventRowInput[],
): CalendarSession[] {
  return [...planRows.map(planRowToSession), ...eventRows.map(eventRowToSession)].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });
}

// --- Date helpers -----------------------------------------------------

export function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDate(a: Date, b: Date): boolean {
  return formatDateISO(a) === formatDateISO(b);
}

export function startOfWeek(date: Date): Date {
  const d = toDateOnly(date);
  return addDays(d, -d.getDay());
}

/** Always 42 cells (6 full weeks), Sunday-first, so the grid never reflows
 * between months with 4 vs 6 visible weeks. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function buildWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Monday-first week, for the agenda page's "This Week" strip — distinct
 * from the Sunday-first grid used by the month/week calendar views. */
export function startOfMondayWeek(date: Date): Date {
  const d = toDateOnly(date);
  const diffFromMonday = (d.getDay() + 6) % 7;
  return addDays(d, -diffFromMonday);
}

export function buildMondayWeek(date: Date): Date[] {
  const start = startOfMondayWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
