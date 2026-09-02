import { NextResponse } from "next/server";

import { closeOpenSession, startSession } from "@/lib/study-sessions";
import { createClient } from "@/lib/supabase/server";
import type { TopicStatus } from "@/types/database";

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
  const status: TopicStatus = body?.status;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { error } = await supabase.from("topics").update({ status }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not update status." }, { status: 500 });
  }

  // Session timer as a side effect of status changes: entering in_progress
  // starts the clock, leaving it (either to done or back to pending) stops it.
  if (status === "in_progress") {
    await startSession(supabase, user.id, id);
  } else {
    await closeOpenSession(supabase, id);
  }

  return NextResponse.json({ ok: true });
}
