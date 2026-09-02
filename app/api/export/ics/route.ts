import { NextResponse } from "next/server";

import { buildIcs, type ExportExam, type ExportSession } from "@/lib/calendar/build-ics";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_START_TIME = "18:00:00";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subject_id");

  if (subjectId) {
    const { data: subject } = await supabase
      .from("subjects")
      .select("id, name, exam_date, slot_start_time")
      .eq("id", subjectId)
      .single();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    // Each subject carries its own recurring slot start time now (Part 3's
    // per-subject booking model) — all sessions in a single-subject export
    // share it, since they all belong to this one subject.
    const startTime = subject.slot_start_time ?? FALLBACK_START_TIME;

    const { data: planRows } = await supabase
      .from("study_plans")
      .select("scheduled_date, planned_minutes, topics(title, difficulty, subtopics)")
      .eq("subject_id", subjectId);

    const sessions: ExportSession[] = (planRows ?? [])
      .filter((r) => r.topics)
      .map((r) => ({
        scheduledDate: r.scheduled_date,
        plannedMinutes: r.planned_minutes,
        topic: r.topics!,
        subjectName: subject.name,
        startTime,
      }));

    if (sessions.length === 0) {
      return NextResponse.json({ error: "No study plan to export yet." }, { status: 400 });
    }

    const exams: ExportExam[] = subject.exam_date
      ? [{ subjectName: subject.name, examDate: subject.exam_date }]
      : [];

    const ics = buildIcs({
      calendarName: `Learnix — ${subject.name}`,
      sessions,
      exams,
      prefixSubjectName: false,
    });

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slugify(subject.name)}-study-plan.ics"`,
      },
    });
  }

  const { data: subjects } = await supabase.from("subjects").select("id, name, exam_date");

  const { data: planRows } = await supabase
    .from("study_plans")
    .select(
      "scheduled_date, planned_minutes, topics(title, difficulty, subtopics), subjects(name, slot_start_time)",
    );

  const sessions: ExportSession[] = (planRows ?? [])
    .filter((r) => r.topics && r.subjects)
    .map((r) => ({
      scheduledDate: r.scheduled_date,
      plannedMinutes: r.planned_minutes,
      topic: r.topics!,
      subjectName: r.subjects!.name,
      startTime: r.subjects!.slot_start_time ?? FALLBACK_START_TIME,
    }));

  if (sessions.length === 0) {
    return NextResponse.json({ error: "No study plans to export yet." }, { status: 400 });
  }

  const exams: ExportExam[] = (subjects ?? [])
    .filter((s): s is typeof s & { exam_date: string } => Boolean(s.exam_date))
    .map((s) => ({ subjectName: s.name, examDate: s.exam_date }));

  const ics = buildIcs({
    calendarName: "Learnix — All Subjects",
    sessions,
    exams,
    prefixSubjectName: true,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="learnix-study-plan.ics"`,
    },
  });
}
