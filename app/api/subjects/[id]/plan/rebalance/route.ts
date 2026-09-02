import { NextResponse } from "next/server";

import { generateStudyPlan, getAvailableStudyDays } from "@/lib/scheduling/generate-plan";
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
    .select("id, exam_date, slot_start_time, slot_end_time, slot_days")
    .eq("id", id)
    .single();

  if (!subject?.exam_date) {
    return NextResponse.json({ error: "Set an exam date before rebalancing." }, { status: 400 });
  }
  if (!subject.slot_start_time || !subject.slot_end_time || !subject.slot_days?.length) {
    return NextResponse.json(
      { error: "Set a daily study time slot for this subject before rebalancing." },
      { status: 400 },
    );
  }

  const { data: incompleteTopics } = await supabase
    .from("topics")
    .select("id, unit_no, difficulty, subtopics")
    .eq("subject_id", id)
    .neq("status", "done");

  if (!incompleteTopics || incompleteTopics.length === 0) {
    return NextResponse.json({ error: "No incomplete topics to rebalance." }, { status: 400 });
  }

  const dailyStudyMinutes = toMinutes(subject.slot_end_time) - toMinutes(subject.slot_start_time);
  const studyDays = subject.slot_days as StudyDay[];

  const today = new Date();
  const examDate = new Date(`${subject.exam_date}T00:00:00`);
  const availableDays = getAvailableStudyDays(today, examDate, studyDays);

  const result = generateStudyPlan(incompleteTopics, availableDays, dailyStudyMinutes);
  if (result.error || !result.sessions) {
    return NextResponse.json(
      { error: result.error ?? "Could not rebalance the plan." },
      { status: 400 },
    );
  }

  const incompleteTopicIds = incompleteTopics.map((t) => t.id);
  await supabase
    .from("study_plans")
    .delete()
    .eq("subject_id", id)
    .in("topic_id", incompleteTopicIds);

  const rows = result.sessions.map((s) => ({
    subject_id: id,
    topic_id: s.topic_id,
    scheduled_date: s.scheduled_date,
    planned_minutes: s.planned_minutes,
  }));

  const { error: insertError } = await supabase.from("study_plans").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: "Could not save the rebalanced plan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
