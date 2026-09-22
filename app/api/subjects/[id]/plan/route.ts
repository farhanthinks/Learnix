import { NextResponse } from "next/server";

import {
  generateStudyPlan,
  getAvailableStudyDays,
  NO_BREAKS,
} from "@/lib/scheduling/generate-plan";
import type { BreakPreferences } from "@/lib/scheduling/generate-plan";
import { toMinutes } from "@/lib/scheduling/slot-conflict";
import { createClient } from "@/lib/supabase/server";
import type { StudyDay } from "@/types/database";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select(
      "id, exam_date, slot_start_time, slot_end_time, slot_days, break_enabled, break_minutes, break_frequency",
    )
    .eq("id", id)
    .single();

  if (!subject) {
    return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  }
  if (!subject.exam_date) {
    return NextResponse.json(
      { error: "Set an exam date before generating a plan." },
      { status: 400 },
    );
  }
  if (!subject.slot_start_time || !subject.slot_end_time || !subject.slot_days?.length) {
    return NextResponse.json(
      { error: "Set your study preferences for this subject before generating a plan." },
      { status: 400 },
    );
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("id, unit_no, difficulty, subtopics")
    .eq("subject_id", id);

  if (!topics || topics.length === 0) {
    return NextResponse.json(
      { error: "This subject has no extracted topics yet." },
      { status: 400 },
    );
  }

  const dailyStudyMinutes = toMinutes(subject.slot_end_time) - toMinutes(subject.slot_start_time);
  const studyDays = subject.slot_days as StudyDay[];

  const today = new Date();
  const examDate = new Date(`${subject.exam_date}T00:00:00`);
  const availableDays = getAvailableStudyDays(today, examDate, studyDays);

  const breakPrefs: BreakPreferences = subject.break_enabled
    ? {
        enabled: true,
        minutes: subject.break_minutes ?? 15,
        frequency: subject.break_frequency ?? 2,
      }
    : NO_BREAKS;

  const result = generateStudyPlan(
    topics,
    availableDays,
    dailyStudyMinutes,
    subject.slot_start_time.slice(0, 5),
    breakPrefs,
  );
  if (result.error || !result.sessions) {
    return NextResponse.json(
      { error: result.error ?? "Could not generate a plan." },
      { status: 400 },
    );
  }

  await supabase.from("study_plans").delete().eq("subject_id", id);
  await supabase.from("calendar_events").delete().eq("subject_id", id).eq("event_type", "break");

  const rows = result.sessions.map((s) => ({
    subject_id: id,
    topic_id: s.topic_id,
    scheduled_date: s.scheduled_date,
    planned_minutes: s.planned_minutes,
    start_time: s.start_time,
    end_time: s.end_time,
  }));

  const { error: insertError } = await supabase.from("study_plans").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: "Could not save the generated plan." }, { status: 500 });
  }

  if (result.breaks && result.breaks.length > 0) {
    const breakRows = result.breaks.map((b) => ({
      user_id: user.id,
      subject_id: id,
      title: "Break",
      event_type: "break" as const,
      scheduled_date: b.scheduled_date,
      start_time: b.start_time,
      end_time: b.end_time,
      status: "done" as const,
    }));
    const { error: breakInsertError } = await supabase.from("calendar_events").insert(breakRows);
    if (breakInsertError) {
      return NextResponse.json(
        { error: "Could not save the generated plan's breaks." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
