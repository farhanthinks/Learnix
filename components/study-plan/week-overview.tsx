"use client";

import { buildMondayWeek, formatDateISO } from "@/lib/calendar/session";
import type { CalendarSession } from "@/lib/calendar/session";

const SHORT_WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekOverview({
  sessions,
  selectedDate,
  onSelectDate,
}: {
  sessions: CalendarSession[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const weekDays = buildMondayWeek(selectedDate);
  const selectedIso = formatDateISO(selectedDate);

  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {weekDays.map((d, i) => {
        const iso = formatDateISO(d);
        const daySessions = sessions.filter((s) => s.date === iso);
        const isSelected = iso === selectedIso;
        const allDone = daySessions.length > 0 && daySessions.every((s) => s.status === "done");

        return (
          <button
            key={iso}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${SHORT_WEEKDAY[i]} ${d.getDate()}, ${daySessions.length} ${daySessions.length === 1 ? "session" : "sessions"}`}
            onClick={() => onSelectDate(d)}
            className={`flex h-[104px] min-w-[42px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors ${
              isSelected
                ? "bg-accent-primary border-accent-primary text-white"
                : "border-border bg-surface text-text-primary hover:bg-surface-raised"
            }`}
          >
            <span
              className={`text-[11px] font-medium ${isSelected ? "text-white/80" : "text-text-secondary"}`}
            >
              {SHORT_WEEKDAY[i]}
            </span>
            <span className="text-base font-semibold">{d.getDate()}</span>
            <span className={`text-[11px] ${isSelected ? "text-white/80" : "text-text-secondary"}`}>
              {daySessions.length}
            </span>
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                allDone ? (isSelected ? "bg-white" : "bg-accent-success") : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
