import { redirect } from "next/navigation";

import type { SubjectRowData, SubjectStatus } from "@/components/subjects/subject-row";
import { SubjectsListShell, type StudyTip } from "@/components/subjects/subjects-list-shell";
import { formatDateISO } from "@/lib/calendar/session";
import { estimateTopicMinutes } from "@/lib/topics/estimate";
import { createClient } from "@/lib/supabase/server";

const EXAM_SOON_DAYS = 10;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function SubjectsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayIso = formatDateISO(new Date());
  const monthPrefix = todayIso.slice(0, 7);

  const [{ data: subjects }, { data: topics }, { data: closedSessions }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, slug, name, exam_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("topics").select("subject_id, unit_no, status, difficulty, subtopics"),
    supabase
      .from("study_sessions")
      .select("started_at, duration_minutes")
      .not("ended_at", "is", null),
  ]);

  const totalStudyMinutesThisMonth = (closedSessions ?? [])
    .filter((s) => s.started_at.slice(0, 7) === monthPrefix)
    .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  interface SubjectAgg {
    topicsTotal: number;
    topicsDone: number;
    units: Set<number>;
    estimatedMinutes: number;
  }
  const aggBySubject = new Map<string, SubjectAgg>();
  for (const t of topics ?? []) {
    const agg = aggBySubject.get(t.subject_id) ?? {
      topicsTotal: 0,
      topicsDone: 0,
      units: new Set<number>(),
      estimatedMinutes: 0,
    };
    agg.topicsTotal += 1;
    if (t.status === "done") agg.topicsDone += 1;
    agg.units.add(t.unit_no ?? 0);
    agg.estimatedMinutes += estimateTopicMinutes(t);
    aggBySubject.set(t.subject_id, agg);
  }

  const subjectRows: SubjectRowData[] = (subjects ?? []).map((s) => {
    const agg = aggBySubject.get(s.id) ?? {
      topicsTotal: 0,
      topicsDone: 0,
      units: new Set<number>(),
      estimatedMinutes: 0,
    };
    const daysUntilExam = s.exam_date ? daysBetween(todayIso, s.exam_date) : null;
    const examSoon =
      daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= EXAM_SOON_DAYS;

    let status: SubjectStatus;
    if (agg.topicsTotal > 0 && agg.topicsDone === agg.topicsTotal) {
      status = "completed";
    } else if (agg.topicsTotal === 0) {
      status = "not_started";
    } else {
      status = "in_progress";
    }

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      examDate: s.exam_date,
      topicsTotal: agg.topicsTotal,
      topicsDone: agg.topicsDone,
      unitsTotal: agg.units.size,
      estimatedMinutes: agg.estimatedMinutes,
      status,
      examSoon,
      daysUntilExam,
    };
  });

  const nearestExamSubject = subjectRows
    .filter((s) => s.daysUntilExam !== null && s.daysUntilExam >= 0)
    .sort((a, b) => a.daysUntilExam! - b.daysUntilExam!)[0];

  const tip: StudyTip | null = nearestExamSubject
    ? {
        subjectName: nearestExamSubject.name,
        subjectSlug: nearestExamSubject.slug,
        daysLeft: nearestExamSubject.daysUntilExam!,
        topicsRemaining: nearestExamSubject.topicsTotal - nearestExamSubject.topicsDone,
      }
    : null;

  return (
    <SubjectsListShell
      subjects={subjectRows}
      totalStudyMinutesThisMonth={totalStudyMinutesThisMonth}
      tip={tip}
    />
  );
}
