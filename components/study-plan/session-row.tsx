"use client";

import { Check, Coffee, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ReschedulePopover } from "@/components/study-plan/reschedule-popover";
import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { formatTime12, toMinutes } from "@/lib/calendar/session";
import type { CalendarSession } from "@/lib/calendar/session";
import { getSessionColor } from "@/lib/calendar/style";
import type { TopicStatus } from "@/types/database";

function ActionButtons({
  session,
  onStart,
  onComplete,
}: {
  session: CalendarSession;
  onStart: () => void;
  onComplete: () => void;
}) {
  if (session.status === "done") {
    return (
      <span className="border-border text-text-secondary inline-flex w-auto items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium">
        Completed <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (session.status === "in_progress") {
    return (
      <div className="flex items-center gap-1.5">
        {session.subjectSlug && session.topicSlug ? (
          <Link
            href={`/dashboard/answer-book/${session.subjectSlug}/${session.topicSlug}`}
            className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 inline-flex w-auto items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Continue
          </Link>
        ) : (
          <span className="bg-accent-primary/10 text-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium">
            In Progress
          </span>
        )}
        <button
          type="button"
          onClick={onComplete}
          className="border-accent-success text-accent-success hover:bg-accent-success/10 inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          Complete
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onStart}
        className="border-accent-primary text-accent-primary hover:bg-accent-primary/10 inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        Start
      </button>
      <button
        type="button"
        disabled
        title="Start the session before marking it complete"
        className="border-border text-text-secondary inline-flex w-auto cursor-not-allowed items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium opacity-50"
      >
        Complete
      </button>
    </div>
  );
}

export function SessionRow({
  session,
  isMissed,
  onStatusChange,
  onReschedule,
  onEdit,
  onDelete,
}: {
  session: CalendarSession;
  isMissed: boolean;
  onStatusChange: (session: CalendarSession, status: TopicStatus) => void;
  onReschedule: (session: CalendarSession, newDate: string) => void;
  onEdit: (session: CalendarSession) => void;
  onDelete: (session: CalendarSession) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const color = getSessionColor(session);
  const done = session.status === "done";

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  function handleStart() {
    onStatusChange(session, "in_progress");
  }

  function handleComplete() {
    onStatusChange(session, "done");
  }

  if (session.type === "break") {
    return (
      <div className="border-border relative flex items-center gap-4 border-b border-dashed py-2.5 last:border-0">
        <div className="w-20 shrink-0">
          <p className="text-text-secondary text-sm font-medium">
            {formatTime12(session.startTime)}
          </p>
          <p className="text-text-secondary/70 text-xs">
            {toMinutes(session.endTime) - toMinutes(session.startTime)} min
          </p>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Coffee className="text-text-secondary h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <p className="text-text-secondary truncate text-xs font-medium tracking-wide uppercase">
            Break
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Break actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="border-border bg-surface absolute top-9 right-0 z-20 w-40 overflow-hidden rounded-lg border py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(session);
                }}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Edit Break
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(session);
                }}
                className="text-accent-danger hover:bg-accent-danger/10 block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-border relative flex items-center gap-4 border-b py-3.5 last:border-0">
      <div className="w-20 shrink-0">
        <p className="text-text-primary text-sm font-semibold">{formatTime12(session.startTime)}</p>
        <p className="text-text-secondary text-xs">
          {toMinutes(session.endTime) - toMinutes(session.startTime)} min
        </p>
      </div>

      <div className="flex min-w-0 flex-1 items-stretch gap-3">
        <span className={`w-1 shrink-0 rounded-full ${color.dot} ${done ? "opacity-40" : ""}`} />
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={`min-w-0 shrink truncate text-sm font-semibold ${done ? "text-text-secondary line-through" : "text-text-primary"}`}
            >
              {session.title}
            </p>
            {session.difficulty && (
              <span className="shrink-0">
                <DifficultyBadge difficulty={session.difficulty} />
              </span>
            )}
          </div>
          {session.subjectName && (
            <p className="text-text-secondary truncate text-xs">{session.subjectName}</p>
          )}
          {isMissed && (
            <span className="bg-accent-danger/10 text-accent-danger mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium">
              Missed
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ActionButtons session={session} onStart={handleStart} onComplete={handleComplete} />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Session actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="border-border bg-surface absolute top-9 right-0 z-20 w-44 overflow-hidden rounded-lg border py-1 shadow-lg"
            >
              {session.status === "pending" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(session, "in_progress");
                  }}
                  className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  Start Session
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onStatusChange(session, done ? "pending" : "done");
                }}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                {done ? "Mark Incomplete" : "Mark Complete"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setRescheduleOpen(true);
                }}
                className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Reschedule
              </button>
              {session.source === "event" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(session);
                  }}
                  className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  Edit Session
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(session);
                }}
                className="text-accent-danger hover:bg-accent-danger/10 block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {rescheduleOpen && (
            <ReschedulePopover
              currentDate={session.date}
              onClose={() => setRescheduleOpen(false)}
              onReschedule={(newDate) => {
                setRescheduleOpen(false);
                onReschedule(session, newDate);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
