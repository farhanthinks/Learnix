export interface SubjectSlot {
  id: string;
  name: string;
  slot_start_time: string | null;
  slot_end_time: string | null;
  slot_days: string[] | null;
}

export interface TimeSlotInput {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  days: string[];
}

export interface SlotConflict {
  subjectName: string;
  days: string[];
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks a candidate time slot against every other subject's saved slot for
 * overlapping minutes on at least one shared day. Subjects without a slot
 * set yet (legacy data, or mid-setup) are skipped — they can't conflict.
 */
export function findSlotConflict(
  candidate: TimeSlotInput,
  existingSubjects: SubjectSlot[],
  excludeSubjectId?: string,
): SlotConflict | null {
  const candidateStart = toMinutes(candidate.startTime);
  const candidateEnd = toMinutes(candidate.endTime);

  for (const subject of existingSubjects) {
    if (subject.id === excludeSubjectId) continue;
    if (!subject.slot_start_time || !subject.slot_end_time || !subject.slot_days?.length) continue;

    const existingStart = toMinutes(subject.slot_start_time);
    const existingEnd = toMinutes(subject.slot_end_time);
    if (!rangesOverlap(candidateStart, candidateEnd, existingStart, existingEnd)) continue;

    const overlappingDays = candidate.days.filter((d) => subject.slot_days!.includes(d));
    if (overlappingDays.length > 0) {
      return { subjectName: subject.name, days: overlappingDays };
    }
  }

  return null;
}

const DAY_LABELS: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function formatHour12(hhmm: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: m, period };
}

export function formatTimeRange(startHHMM: string, endHHMM: string): string {
  const start = formatHour12(startHHMM);
  const end = formatHour12(endHHMM);
  const startStr =
    start.minute === 0 ? `${start.hour}` : `${start.hour}:${String(start.minute).padStart(2, "0")}`;
  const endStr =
    end.minute === 0 ? `${end.hour}` : `${end.hour}:${String(end.minute).padStart(2, "0")}`;

  if (start.period === end.period) {
    return `${startStr}–${endStr} ${end.period}`;
  }
  return `${startStr} ${start.period}–${endStr} ${end.period}`;
}

export function formatConflictMessage(candidate: TimeSlotInput, conflict: SlotConflict): string {
  const range = formatTimeRange(candidate.startTime, candidate.endTime);
  const days = conflict.days
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map((d) => DAY_LABELS[d] ?? d)
    .join(", ");
  return `${range} is already booked for ${conflict.subjectName} on ${days}. Pick a different time.`;
}
