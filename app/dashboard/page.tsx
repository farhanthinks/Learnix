import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";

import { AnalyticsPreviewTile } from "@/components/dashboard/analytics-preview-tile";
import { ExamCountdownTile } from "@/components/dashboard/exam-countdown-tile";
import { OverallProgressCard } from "@/components/dashboard/overall-progress-card";
import { QuickActionsTile } from "@/components/dashboard/quick-actions-tile";
import { StudyStreakCard } from "@/components/dashboard/study-streak-card";
import { StudyTimeWeekCard } from "@/components/dashboard/study-time-week-card";
import { SubjectsTile, type DashboardSubject } from "@/components/dashboard/subjects-tile";
import { TodayPlanTile, type TodayPlanItem } from "@/components/dashboard/today-plan-tile";
import { TopicProgressTile } from "@/components/dashboard/topic-progress-tile";
import { computeLongestStreak, computeStreak } from "@/lib/study-plan/streak";
import { createClient } from "@/lib/supabase/server";

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = todayString();
  const todayLabel = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const [subjectsRes, todayPlanRes, topicsRes, sessionsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, slug, name, exam_date, extraction_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("study_plans")
      .select(
        "id, planned_minutes, topics(id, slug, title, difficulty, status), subjects(id, slug, name)",
      )
      .eq("scheduled_date", today)
      .order("created_at", { ascending: true }),
    supabase.from("topics").select("subject_id, status"),
    // Unfiltered by date (unlike the old query) so the streak can be computed
    // from full history, not just the last 7 days — the 7-day chart/total
    // below is derived from this same set by filtering in JS instead of
    // running a second query against the same table.
    supabase
      .from("study_sessions")
      .select("started_at, duration_minutes")
      .not("ended_at", "is", null),
  ]);

  const subjects = subjectsRes.data ?? [];
  const allTopics = topicsRes.data ?? [];
  const allSessions = sessionsRes.data ?? [];

  const topicsBySubject = new Map<string, { done: number; total: number }>();
  for (const topic of allTopics) {
    const entry = topicsBySubject.get(topic.subject_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (topic.status === "done") entry.done += 1;
    topicsBySubject.set(topic.subject_id, entry);
  }

  const dashboardSubjects: DashboardSubject[] = subjects.map((s) => {
    const counts = topicsBySubject.get(s.id) ?? { done: 0, total: 0 };
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      exam_date: s.exam_date,
      extraction_status: s.extraction_status,
      topicsDone: counts.done,
      topicsTotal: counts.total,
    };
  });

  const todayPlanItems: TodayPlanItem[] = (todayPlanRes.data ?? [])
    .filter((r) => r.topics && r.subjects)
    .map((r) => ({
      id: r.id,
      subjectSlug: r.subjects!.slug,
      subjectName: r.subjects!.name,
      topicSlug: r.topics!.slug,
      topicTitle: r.topics!.title,
      difficulty: r.topics!.difficulty,
      status: r.topics!.status,
      plannedMinutes: r.planned_minutes,
    }));

  const doneCount = allTopics.filter((t) => t.status === "done").length;
  const inProgressCount = allTopics.filter((t) => t.status === "in_progress").length;
  const pendingCount = allTopics.filter((t) => t.status === "pending").length;

  const minutesByDay = new Map<string, number>();
  for (const session of allSessions) {
    const day = session.started_at.slice(0, 10);
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + (session.duration_minutes ?? 0));
  }
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = toDateString(d);
    return { date: dateStr, minutes: minutesByDay.get(dateStr) ?? 0 };
  });
  const weekMinutes = weekly.reduce((sum, w) => sum + w.minutes, 0);

  const studiedDates = new Set(allSessions.map((s) => s.started_at.slice(0, 10)));
  const currentStreak = computeStreak(studiedDates, today);
  const bestStreak = computeLongestStreak(studiedDates);

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-text-primary text-[28px] font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm">
            Welcome back! Keep up with your study goals.
          </p>
        </div>
        <span className="border-border text-text-secondary inline-flex w-auto items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
          <Calendar className="h-4 w-4" strokeWidth={2} />
          {todayLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ExamCountdownTile subjects={subjects} />
        <OverallProgressCard done={doneCount} total={allTopics.length} />
        <StudyStreakCard currentStreak={currentStreak} bestStreak={bestStreak} />
        <StudyTimeWeekCard minutes={weekMinutes} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <SubjectsTile subjects={dashboardSubjects} />
        <TodayPlanTile items={todayPlanItems} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr_1.3fr]">
        <TopicProgressTile
          completed={doneCount}
          inProgress={inProgressCount}
          pending={pendingCount}
        />
        <AnalyticsPreviewTile weekly={weekly} />
        <QuickActionsTile />
      </div>
    </div>
  );
}
