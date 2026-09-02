import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEventType, TopicDifficulty } from "@/types/database";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_TYPES: CalendarEventType[] = ["study", "revision", "practice", "exam", "other"];
const VALID_DIFFICULTIES: TopicDifficulty[] = ["easy", "medium", "hard"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const subjectId = body?.subjectId ? String(body.subjectId) : null;
  const scheduledDate = String(body?.scheduledDate ?? "");
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");
  const eventType: CalendarEventType = VALID_TYPES.includes(body?.eventType)
    ? body.eventType
    : "study";
  const difficulty: TopicDifficulty | null = VALID_DIFFICULTIES.includes(body?.difficulty)
    ? body.difficulty
    : null;
  const notes = body?.notes ? String(body.notes).trim() : null;

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!DATE_RE.test(scheduledDate)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return NextResponse.json(
      { error: "A valid start and end time are required." },
      { status: 400 },
    );
  }
  if (startTime >= endTime) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  if (subjectId) {
    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      title,
      event_type: eventType,
      difficulty,
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create calendar event:", error);
    return NextResponse.json(
      { error: `Could not create the session: ${error?.message ?? "unknown error"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id });
}
