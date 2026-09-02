import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase.from("study_plans").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete study plan session:", error);
    return NextResponse.json({ error: "Could not delete the session." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
