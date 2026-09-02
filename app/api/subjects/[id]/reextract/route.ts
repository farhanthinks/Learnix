import { NextResponse } from "next/server";

import { processSyllabus } from "@/lib/syllabus/process";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, syllabus_file_url")
    .eq("id", id)
    .single();

  if (!subject?.syllabus_file_url) {
    return NextResponse.json(
      { error: "No syllabus file found for this subject." },
      { status: 404 },
    );
  }

  await processSyllabus(supabase, subject.id, subject.syllabus_file_url);

  return NextResponse.json({ ok: true });
}
