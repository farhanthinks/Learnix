import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEventType, Database, TopicDifficulty, TopicStatus } from "@/types/database";

type CalendarEventUpdate = Database["public"]["Tables"]["calendar_events"]["Update"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_TYPES: CalendarEventType[] = ["study", "revision", "practice", "exam", "other"];
const VALID_DIFFICULTIES: TopicDifficulty[] = ["easy", "medium", "hard"];
const VALID_STATUSES: TopicStatus[] = ["pending", "in_progress", "done"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: CalendarEventUpdate = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    update.title = title;
  }
  if (body.subjectId !== undefined) {
    update.subject_id = body.subjectId ? String(body.subjectId) : null;
  }
  if (body.scheduledDate !== undefined) {
    if (!DATE_RE.test(body.scheduledDate)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    update.scheduled_date = body.scheduledDate;
  }
  if (body.startTime !== undefined || body.endTime !== undefined) {
    const startTime = String(body.startTime ?? "");
    const endTime = String(body.endTime ?? "");
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      return NextResponse.json(
        { error: "A valid start and end time are required." },
        { status: 400 },
      );
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }
    update.start_time = startTime;
    update.end_time = endTime;
  }
  if (body.eventType !== undefined) {
    if (!VALID_TYPES.includes(body.eventType)) {
      return NextResponse.json({ error: "Invalid session type." }, { status: 400 });
    }
    update.event_type = body.eventType;
  }
  if (body.difficulty !== undefined) {
    update.difficulty = VALID_DIFFICULTIES.includes(body.difficulty) ? body.difficulty : null;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes ? String(body.notes).trim() : null;
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("calendar_events")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update calendar event:", error);
    return NextResponse.json({ error: "Could not update the session." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete calendar event:", error);
    return NextResponse.json({ error: "Could not delete the session." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
