import { redirect } from "next/navigation";

import type { SubjectNeedingPlan } from "@/components/study-plan/generate-plan-prompt";
import { StudyPlanShell } from "@/components/study-plan/study-plan-shell";
import type { DeadlineSubject } from "@/components/study-plan/upcoming-deadlines-card";
import { formatDateISO, mergeSessions } from "@/lib/calendar/session";
import type { EventRowInput, PlanRowInput } from "@/lib/calendar/session";
import { computeStudyPlanHealth } from "@/lib/study-plan/health";
import { computeStreak } from "@/lib/study-plan/streak";
import { createClient } from "@/lib/supabase/server";

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function StudyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectSlugFilter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const todayIso = formatDateISO(now);
  const sevenDaysAgoDate = new Date(now);
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgo = formatDateISO(sevenDaysAgoDate);

  const [
    { data: subjects },
    { data: topics },
    { data: planRows },
    { data: eventRows },
    { data: closedSessions },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, slug, name, exam_date")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase.from("topics").select("id, subject_id, status, difficulty"),
    supabase
      .from("study_plans")
      .select(
        "id, scheduled_date, planned_minutes, start_time, end_time, subject_id, topic_id, subjects(name, slug, slot_start_time), topics(title, slug, difficulty, status)",
      ),
    supabase
      .from("calendar_events")
      .select(
        "id, title, subject_id, topic_id, scheduled_date, start_time, end_time, event_type, difficulty, status, notes, subjects(name, slug), topics(slug)",
      ),
    supabase
      .from("study_sessions")
      .select("started_at")
      .not("ended_at", "is", null)
      .gte("started_at", `${sevenDaysAgo}T00:00:00.000Z`),
  ]);

  const planInputs: PlanRowInput[] = (planRows ?? [])
    .filter((r) => r.subjects && r.topics)
    .map((r) => ({
      id: r.id,
      scheduled_date: r.scheduled_date,
      planned_minutes: r.planned_minutes,
      subject_id: r.subject_id,
      subject_slug: r.subjects!.slug,
      subject_name: r.subjects!.name,
      subject_slot_start_time: r.subjects!.slot_start_time,
      start_time: r.start_time,
      end_time: r.end_time,
      topic_id: r.topic_id,
      topic_slug: r.topics!.slug,
      topic_title: r.topics!.title,
      topic_difficulty: r.topics!.difficulty,
      topic_status: r.topics!.status,
    }));

  const eventInputs: EventRowInput[] = (eventRows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    subject_id: r.subject_id,
    subject_slug: r.subjects?.slug ?? null,
    subject_name: r.subjects?.name ?? null,
    topic_id: r.topic_id,
    topic_slug: r.topics?.slug ?? null,
    scheduled_date: r.scheduled_date,
    start_time: r.start_time,
    end_time: r.end_time,
    event_type: r.event_type,
    difficulty: r.difficulty,
    status: r.status,
    notes: r.notes,
  }));

  const sessions = mergeSessions(planInputs, eventInputs);

  // Streak: distinct UTC calendar dates with at least one completed session
  // (same bucketing approach used elsewhere in the app, since the student's
  // IANA timezone isn't collected anywhere).
  const studiedDates = new Set((closedSessions ?? []).map((s) => s.started_at.slice(0, 10)));
  const streak = computeStreak(studiedDates, todayIso);

  const allTopics = topics ?? [];
  const topicsDone = allTopics.filter((t) => t.status === "done").length;
  const topicsTotal = allTopics.length;

  const health = computeStudyPlanHealth(
    sessions.filter((s) => s.type !== "break").map((s) => ({ date: s.date, status: s.status })),
    allTopics.map((t) => ({ status: t.status, difficulty: t.difficulty })),
    (subjects ?? []).map((s) => ({ name: s.name, examDate: s.exam_date })),
    todayIso,
  );

  const subjectIdsNeedingOptimization = Array.from(
    new Set(
      sessions
        .filter((s) => s.source === "plan" && s.date < todayIso && s.status !== "done")
        .map((s) => s.subjectId)
        .filter((id): id is string => id !== null),
    ),
  );

  const deadlines: DeadlineSubject[] = (subjects ?? [])
    .filter(
      (s): s is typeof s & { exam_date: string } =>
        Boolean(s.exam_date) && s.exam_date! >= todayIso,
    )
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      examDate: s.exam_date,
      daysLeft: daysBetween(todayIso, s.exam_date),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const subjectIdsWithPlan = new Set(planInputs.map((p) => p.subject_id));
  const topicCountBySubject = new Map<string, number>();
  for (const t of allTopics) {
    topicCountBySubject.set(t.subject_id, (topicCountBySubject.get(t.subject_id) ?? 0) + 1);
  }
  const subjectsNeedingPlan: SubjectNeedingPlan[] = (subjects ?? [])
    .filter((s) => (topicCountBySubject.get(s.id) ?? 0) > 0 && !subjectIdsWithPlan.has(s.id))
    .map((s) => ({ id: s.id, name: s.name }));

  const matchedSubject = subjectSlugFilter
    ? (subjects ?? []).find((s) => s.slug === subjectSlugFilter)
    : undefined;
  const initialSubjectFilter = matchedSubject
    ? { id: matchedSubject.id, name: matchedSubject.name }
    : null;

  return (
    <StudyPlanShell
      initialSessions={sessions}
      subjects={(subjects ?? []).map((s) => ({ id: s.id, slug: s.slug, name: s.name }))}
      streak={streak}
      topicsDone={topicsDone}
      topicsTotal={topicsTotal}
      health={health}
      subjectIdsNeedingOptimization={subjectIdsNeedingOptimization}
      deadlines={deadlines}
      subjectsNeedingPlan={subjectsNeedingPlan}
      initialSubjectFilter={initialSubjectFilter}
    />
  );
}
