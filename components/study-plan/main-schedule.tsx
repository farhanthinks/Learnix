"use client";

import { SessionRow } from "@/components/study-plan/session-row";
import {
  addDays,
  buildMondayWeek,
  formatDateISO,
  formatDurationLabel,
  MONTH_LABELS,
  toMinutes,
} from "@/lib/calendar/session";
import type { CalendarSession } from "@/lib/calendar/session";
import type { TopicStatus } from "@/types/database";

const FULL_WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "Today"/"Tomorrow", or null for anything further out (rendered as a
 * plain short date instead, matching the spec's "Aug 29" with no prefix). */
function relativeDayLabel(iso: string, todayIso: string): string | null {
  if (iso === todayIso) return "Today";
  const tomorrowIso = formatDateISO(addDays(new Date(`${todayIso}T00:00:00`), 1));
  if (iso === tomorrowIso) return "Tomorrow";
  return null;
}

function sortByTime(sessions: CalendarSession[]): CalendarSession[] {
  return [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function EmptyDay({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <p className="text-text-secondary text-sm">{label}</p>
      <button
        type="button"
        onClick={onAdd}
        className="text-accent-primary text-xs font-medium hover:underline"
      >
        + Add Session
      </button>
    </div>
  );
}

interface RowActions {
  onStatusChange: (session: CalendarSession, status: TopicStatus) => void;
  onReschedule: (session: CalendarSession, newDate: string) => void;
  onEdit: (session: CalendarSession) => void;
  onDelete: (session: CalendarSession) => void;
}

export function MainSchedule({
  sessions,
  viewMode,
  selectedDate,
  todayIso,
  onAddSession,
  ...actions
}: {
  sessions: CalendarSession[];
  viewMode: "day" | "week" | "list";
  selectedDate: Date;
  todayIso: string;
  onAddSession: (date: Date) => void;
} & RowActions) {
  const selectedIso = formatDateISO(selectedDate);

  if (viewMode === "day") {
    const daySessions = sortByTime(sessions.filter((s) => s.date === selectedIso));
    const studyCount = daySessions.filter((s) => s.type !== "break").length;
    const isToday = selectedIso === todayIso;
    const title = isToday
      ? "Today's Schedule"
      : `${FULL_WEEKDAY[selectedDate.getDay()]}'s Schedule`;

    return (
      <div className="border-border bg-surface rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-text-primary text-base font-semibold">{title}</h2>
          <span className="bg-accent-primary/10 text-accent-primary rounded-full px-2.5 py-1 text-xs font-medium">
            {studyCount} sessions
          </span>
        </div>
        {daySessions.length === 0 ? (
          <EmptyDay label="No sessions scheduled" onAdd={() => onAddSession(selectedDate)} />
        ) : (
          <div className="mt-3">
            {daySessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isMissed={s.date < todayIso && s.status !== "done"}
                {...actions}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "week") {
    const weekDays = buildMondayWeek(selectedDate);
    return (
      <div className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5">
        <h2 className="font-display text-text-primary text-base font-semibold">
          This Week&apos;s Schedule
        </h2>
        {weekDays.map((d) => {
          const iso = formatDateISO(d);
          const daySessions = sortByTime(sessions.filter((s) => s.date === iso));
          const studyCount = daySessions.filter((s) => s.type !== "break").length;
          return (
            <div key={iso}>
              <div className="border-border flex items-center justify-between border-b pb-1.5">
                <p className="text-text-primary text-sm font-semibold">
                  {SHORT_WEEKDAY[d.getDay()]}, {formatShortDate(iso)}
                </p>
                <span className="text-text-secondary text-xs">{studyCount} sessions</span>
              </div>
              {daySessions.length === 0 ? (
                <p className="text-text-secondary py-3 text-xs">No sessions scheduled</p>
              ) : (
                daySessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    isMissed={s.date < todayIso && s.status !== "done"}
                    {...actions}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const upcoming = sessions
    .filter((s) => s.date >= todayIso)
    .sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date < b.date ? -1 : 1,
    );
  const groupsMap = new Map<string, CalendarSession[]>();
  for (const s of upcoming) {
    if (!groupsMap.has(s.date)) groupsMap.set(s.date, []);
    groupsMap.get(s.date)!.push(s);
  }
  const groups = Array.from(groupsMap.entries());

  return (
    <div className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5">
      <h2 className="font-display text-text-primary text-base font-semibold">Upcoming Tasks</h2>
      {groups.length === 0 ? (
        <p className="text-text-secondary text-sm">No upcoming sessions.</p>
      ) : (
        groups.map(([date, daySessions]) => {
          const studySessions = daySessions.filter((s) => s.type !== "break");
          const totalMinutes = studySessions.reduce(
            (sum, s) => sum + (toMinutes(s.endTime) - toMinutes(s.startTime)),
            0,
          );
          const label = relativeDayLabel(date, todayIso);
          return (
            <div key={date}>
              <div className="border-border flex items-baseline justify-between border-b pb-1.5">
                <p className="text-text-primary text-sm font-semibold">
                  {label ? `${label} · ${formatShortDate(date)}` : formatShortDate(date)}
                </p>
                <span className="text-text-secondary text-xs">
                  {studySessions.length} sessions · {formatDurationLabel(totalMinutes)}
                </span>
              </div>
              {daySessions.map((s) => (
                <SessionRow key={s.id} session={s} isMissed={false} {...actions} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
