import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  const scheduledDate = body?.scheduledDate;

  if (typeof scheduledDate !== "string" || !DATE_RE.test(scheduledDate)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const { error } = await supabase
    .from("study_plans")
    .update({ scheduled_date: scheduledDate })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not reschedule." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
