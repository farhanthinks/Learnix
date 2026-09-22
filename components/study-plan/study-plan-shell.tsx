"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Download,
  Flame,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SummaryCard } from "@/components/study-plan/summary-card";
import { MainSchedule } from "@/components/study-plan/main-schedule";
import { WeekOverview } from "@/components/study-plan/week-overview";
import {
  defaultScheduleFilters,
  hasActiveScheduleFilters,
  ScheduleFiltersBar,
  type ScheduleFilterState,
} from "@/components/study-plan/schedule-filters";
import { StudyPlanHealthCard } from "@/components/study-plan/study-plan-health-card";
import {
  UpcomingDeadlinesCard,
  type DeadlineSubject,
} from "@/components/study-plan/upcoming-deadlines-card";
import {
  GeneratePlanPrompt,
  type SubjectNeedingPlan,
} from "@/components/study-plan/generate-plan-prompt";
import { SessionModal } from "@/components/study-plan/session-modal";
import { addDays, formatDateISO, formatDurationLabel, toMinutes } from "@/lib/calendar/session";
import type { CalendarSession } from "@/lib/calendar/session";
import type { PlanHealth } from "@/lib/study-plan/health";
import type { CalendarEventType, TopicStatus } from "@/types/database";

type ViewMode = "day" | "week" | "list";

export function StudyPlanShell({
  initialSessions,
  subjects,
  streak,
  topicsDone,
  topicsTotal,
  health,
  subjectIdsNeedingOptimization,
  deadlines,
  subjectsNeedingPlan,
  initialSubjectFilter,
}: {
  initialSessions: CalendarSession[];
  subjects: { id: string; slug: string; name: string }[];
  streak: number;
  topicsDone: number;
  topicsTotal: number;
  health: PlanHealth;
  subjectIdsNeedingOptimization: string[];
  deadlines: DeadlineSubject[];
  subjectsNeedingPlan: SubjectNeedingPlan[];
  initialSubjectFilter: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [createModal, setCreateModal] = useState<{ date: Date; type: CalendarEventType } | null>(
    null,
  );
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScheduleFilterState>(() =>
    defaultScheduleFilters(initialSubjectFilter?.id ?? null),
  );

  const todayIso = formatDateISO(new Date());

  const editingSession = useMemo(
    () => sessions.find((s) => s.id === editSessionId) ?? null,
    [sessions, editSessionId],
  );

  const visibleSessions = useMemo(
    () =>
      sessions.filter((s) => {
        if (filters.subjectId && s.subjectId !== filters.subjectId) return false;
        if (filters.status !== "all" && s.status !== filters.status) return false;
        if (filters.difficulty !== "all" && s.difficulty !== filters.difficulty) return false;
        return true;
      }),
    [sessions, filters],
  );

  const todaySessions = useMemo(
    () => visibleSessions.filter((s) => s.date === todayIso && s.type !== "break"),
    [visibleSessions, todayIso],
  );
  const todayPlannedMinutes = useMemo(
    () =>
      todaySessions.reduce((sum, s) => sum + (toMinutes(s.endTime) - toMinutes(s.startTime)), 0),
    [todaySessions],
  );
  const todayCompleted = useMemo(
    () => todaySessions.filter((s) => s.status === "done"),
    [todaySessions],
  );
  const todayCompletedMinutes = useMemo(
    () =>
      todayCompleted.reduce((sum, s) => sum + (toMinutes(s.endTime) - toMinutes(s.startTime)), 0),
    [todayCompleted],
  );
  const overallPercent = topicsTotal === 0 ? 0 : Math.round((topicsDone / topicsTotal) * 100);

  function openCreate(date: Date) {
    setCreateModal({ date, type: "study" });
  }

  function handleSessionSaved(session: CalendarSession) {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === session.id);
      return exists ? prev.map((s) => (s.id === session.id ? session : s)) : [...prev, session];
    });
    setCreateModal(null);
    setEditSessionId(null);
  }

  function applyStatusChange(id: string, status: TopicStatus) {
    setSessions((prev) => {
      const target = prev.find((s) => s.id === id);
      if (!target) return prev;
      // A plan-sourced session's status lives on its topic, shared by every
      // session that topic has (it can span more than one scheduled day).
      if (target.source === "plan") {
        return prev.map((s) =>
          s.source === "plan" && s.topicId === target.topicId ? { ...s, status } : s,
        );
      }
      return prev.map((s) => (s.id === id ? { ...s, status } : s));
    });
  }

  async function updateSessionStatus(session: CalendarSession, status: TopicStatus) {
    applyStatusChange(session.id, status);
    try {
      const res = await fetch(
        session.source === "plan"
          ? `/api/topics/${session.topicId}/status`
          : `/api/calendar-events/${session.rawId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      applyStatusChange(session.id, session.status);
    }
  }

  async function deleteSession(session: CalendarSession) {
    const confirmed = window.confirm(`Remove "${session.title}" from your schedule?`);
    if (!confirmed) return;

    const previous = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    try {
      const res = await fetch(
        session.source === "plan"
          ? `/api/study-plans/${session.rawId}`
          : `/api/calendar-events/${session.rawId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setSessions(previous);
    }
  }

  async function rescheduleSession(session: CalendarSession, newDate: string) {
    const previous = sessions;
    setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, date: newDate } : s)));
    try {
      const res = await fetch(
        session.source === "plan"
          ? `/api/study-plans/${session.rawId}/reschedule`
          : `/api/calendar-events/${session.rawId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            session.source === "plan"
              ? { scheduledDate: newDate }
              : { scheduledDate: newDate, startTime: session.startTime, endTime: session.endTime },
          ),
        },
      );
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setSessions(previous);
    }
  }

  const rowActions = {
    onStatusChange: updateSessionStatus,
    onReschedule: rescheduleSession,
    onEdit: (session: CalendarSession) => setEditSessionId(session.id),
    onDelete: deleteSession,
  };

  function handleFiltersChange(next: ScheduleFilterState) {
    setFilters(next);
    if (next.subjectId === null) {
      router.replace("/dashboard/study-plan");
    }
  }

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">Study Plan</h1>
          <p className="text-text-secondary text-sm">Your personalized study schedule</p>
        </div>
        <a
          href="/api/export/ics"
          className="border-border text-text-primary hover:bg-surface-raised focus-visible:outline-accent-primary inline-flex w-auto items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          title="Downloads an .ics file you can import into Google Calendar or Apple Calendar"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          Export to Calendar
        </a>
      </header>

      <GeneratePlanPrompt subjects={subjectsNeedingPlan} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={CalendarDays}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Today's Sessions"
          value={String(todaySessions.length)}
          hint={`${formatDurationLabel(todayPlannedMinutes)} planned`}
        />
        <SummaryCard
          icon={Check}
          iconClassName="bg-accent-success/10 text-accent-success"
          label="Completed"
          value={String(todayCompleted.length)}
          hint={`${formatDurationLabel(todayCompletedMinutes)} done`}
        />
        <SummaryCard
          icon={Flame}
          iconClassName="bg-accent-warning/10 text-accent-warning"
          label="Study Streak"
          value={String(streak)}
          hint="days in a row"
        />
        <SummaryCard
          icon={TrendingUp}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Overall Progress"
          value={`${overallPercent}%`}
          hint={`${topicsDone} of ${topicsTotal} topics`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
            className="border-border text-text-primary hover:bg-surface-raised rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="text-text-secondary hover:bg-surface-raised flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="text-text-primary min-w-[9rem] text-center text-sm font-semibold">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              aria-label="Next day"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="text-text-secondary hover:bg-surface-raised flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="border-border flex overflow-hidden rounded-lg border">
            {(["day", "week", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  viewMode === v
                    ? "bg-accent-primary text-white"
                    : "text-text-secondary hover:bg-surface-raised"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openCreate(selectedDate)}
            className="bg-accent-primary hidden w-auto items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 sm:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add Session
          </button>
        </div>
      </div>

      <ScheduleFiltersBar filters={filters} onChange={handleFiltersChange} subjects={subjects} />

      {visibleSessions.length === 0 ? (
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
          <CalendarDays className="text-text-secondary h-8 w-8" strokeWidth={1.5} />
          <div>
            <p className="text-text-primary text-sm font-semibold">
              {hasActiveScheduleFilters(filters)
                ? "No sessions match your filters"
                : "Your study plan is empty"}
            </p>
            <p className="text-text-secondary mt-1 text-sm">
              {hasActiveScheduleFilters(filters)
                ? "Try adjusting or clearing your filters."
                : "Create a personalized plan from your subjects and start studying smarter."}
            </p>
          </div>
          <div className="mt-1 flex gap-2">
            {hasActiveScheduleFilters(filters) ? (
              <button
                type="button"
                onClick={() => handleFiltersChange(defaultScheduleFilters())}
                className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
              >
                Clear Filters
              </button>
            ) : (
              <>
                <Link
                  href="/dashboard/subjects"
                  className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
                >
                  Generate Study Plan
                </Link>
                <button
                  type="button"
                  onClick={() => openCreate(new Date())}
                  className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                >
                  + Add Session
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          <MainSchedule
            sessions={visibleSessions}
            viewMode={viewMode}
            selectedDate={selectedDate}
            todayIso={todayIso}
            onAddSession={openCreate}
            {...rowActions}
          />

          <aside className="flex flex-col gap-5">
            <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-text-primary text-sm font-semibold">This Week</h2>
              </div>
              <WeekOverview
                sessions={visibleSessions}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>

            <StudyPlanHealthCard
              health={health}
              subjectIdsNeedingOptimization={subjectIdsNeedingOptimization}
            />

            <UpcomingDeadlinesCard deadlines={deadlines} />
          </aside>
        </div>
      )}

      <button
        type="button"
        onClick={() => openCreate(selectedDate)}
        aria-label="Add session"
        className="bg-accent-primary fixed right-5 bottom-5 z-30 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg hover:brightness-110 sm:hidden"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {createModal && (
        <SessionModal
          subjects={subjects}
          initialDate={createModal.date}
          editingSession={null}
          defaultType={createModal.type}
          onClose={() => setCreateModal(null)}
          onSaved={handleSessionSaved}
        />
      )}
      {editingSession && (
        <SessionModal
          subjects={subjects}
          initialDate={selectedDate}
          editingSession={editingSession}
          defaultType={editingSession.type}
          onClose={() => setEditSessionId(null)}
          onSaved={handleSessionSaved}
        />
      )}
    </div>
  );
}
