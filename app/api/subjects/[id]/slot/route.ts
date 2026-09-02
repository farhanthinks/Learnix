import { NextResponse } from "next/server";

import { findSlotConflict, formatConflictMessage } from "@/lib/scheduling/slot-conflict";
import { createClient } from "@/lib/supabase/server";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
  const slotStartTime = String(body?.slotStartTime ?? "");
  const slotEndTime = String(body?.slotEndTime ?? "");
  const slotDays: string[] = Array.isArray(body?.slotDays)
    ? body.slotDays.filter((d: unknown) => typeof d === "string" && VALID_DAYS.includes(d))
    : [];

  if (!TIME_RE.test(slotStartTime) || !TIME_RE.test(slotEndTime)) {
    return NextResponse.json({ error: "Please set a valid start and end time." }, { status: 400 });
  }
  if (slotStartTime >= slotEndTime) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }
  if (slotDays.length === 0) {
    return NextResponse.json({ error: "Please select at least one study day." }, { status: 400 });
  }

  const { data: existingSubjects } = await supabase
    .from("subjects")
    .select("id, name, slot_start_time, slot_end_time, slot_days")
    .eq("user_id", user.id);

  const conflict = findSlotConflict(
    { startTime: slotStartTime, endTime: slotEndTime, days: slotDays },
    existingSubjects ?? [],
    id,
  );

  if (conflict) {
    return NextResponse.json(
      {
        error: formatConflictMessage(
          { startTime: slotStartTime, endTime: slotEndTime, days: slotDays },
          conflict,
        ),
      },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("subjects")
    .update({ slot_start_time: slotStartTime, slot_end_time: slotEndTime, slot_days: slotDays })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not save the study time slot." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
