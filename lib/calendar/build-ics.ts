import ical, { ICalAlarmType } from "ical-generator";

const REMINDER_SECONDS_BEFORE = 30 * 60;

export interface ExportTopic {
  title: string;
  difficulty: string;
  subtopics: string[] | null;
}

export interface ExportSession {
  scheduledDate: string; // YYYY-MM-DD
  plannedMinutes: number;
  topic: ExportTopic;
  subjectName: string;
  /** This session's own subject's slot start time ("HH:MM" or "HH:MM:SS") —
   * each subject now owns its own recurring time slot, so this is no longer
   * a single value shared across the whole export. */
  startTime: string;
}

export interface ExportExam {
  subjectName: string;
  examDate: string; // YYYY-MM-DD
}

export interface BuildIcsParams {
  calendarName: string;
  sessions: ExportSession[];
  exams: ExportExam[];
  prefixSubjectName: boolean;
}

function parseDateParts(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m, d];
}

function parseTimeParts(hhmm: string): [number, number] {
  const [hourStr, minuteStr] = hhmm.slice(0, 5).split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  return [Number.isFinite(hour) ? hour : 18, Number.isFinite(minute) ? minute : 0];
}

/**
 * Builds a Date whose UTC getters return the intended wall-clock numbers.
 * ical-generator's `floating: true` events are serialized using UTC getters
 * on the Date object, so this is the one construction that reliably
 * produces "18:00, no timezone attached" regardless of what timezone the
 * server process itself happens to be running in.
 */
function floatingDate(dateStr: string, hour = 0, minute = 0): Date {
  const [y, m, d] = parseDateParts(dateStr);
  return new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
}

export function buildIcs(params: BuildIcsParams): string {
  const cal = ical({
    name: params.calendarName,
    prodId: { company: "Learnix", product: "Study Plan", language: "EN" },
  });

  for (const session of params.sessions) {
    const [hour, minute] = parseTimeParts(session.startTime);
    const start = floatingDate(session.scheduledDate, hour, minute);
    const end = new Date(start.getTime() + session.plannedMinutes * 60_000);

    const title = params.prefixSubjectName
      ? `[${session.subjectName}] Study: ${session.topic.title}`
      : `Study: ${session.topic.title}`;

    const descriptionLines = [`Difficulty: ${session.topic.difficulty}`];
    if (session.topic.subtopics && session.topic.subtopics.length > 0) {
      descriptionLines.push("", "Subtopics:");
      for (const subtopic of session.topic.subtopics) {
        descriptionLines.push(`- ${subtopic}`);
      }
    }

    const event = cal.createEvent({
      start,
      end,
      summary: title,
      description: descriptionLines.join("\n"),
      floating: true,
    });

    event.createAlarm({ type: ICalAlarmType.display, trigger: REMINDER_SECONDS_BEFORE });
  }

  for (const exam of params.exams) {
    cal.createEvent({
      start: floatingDate(exam.examDate),
      allDay: true,
      summary: `Exam: ${exam.subjectName}`,
      floating: true,
    });
  }

  return cal.toString();
}
