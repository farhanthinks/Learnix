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
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Subject name is required." }, { status: 400 });
  }

  const examDateRaw = body.examDate ? String(body.examDate).trim() : "";
  if (examDateRaw && !DATE_RE.test(examDateRaw)) {
    return NextResponse.json({ error: "Invalid exam date." }, { status: 400 });
  }

  // The slug stays as-is on rename — reslugging would change the subject's
  // URL out from under anyone who's bookmarked or shared it.
  const { error } = await supabase
    .from("subjects")
    .update({ name, exam_date: examDateRaw || null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update subject:", error);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
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

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, syllabus_file_url")
    .eq("id", id)
    .single();

  if (!subject) {
    return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  }

  // Topics, study_plans, study_sessions, topic_notes, quizzes, quiz_questions,
  // and quiz_attempts all cascade-delete via existing FK constraints.
  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not delete the subject." }, { status: 500 });
  }

  // Storage isn't covered by the DB cascade — clean up the uploaded PDF too.
  // Best-effort: a failure here shouldn't undo the subject deletion.
  if (subject.syllabus_file_url) {
    await supabase.storage.from("syllabi").remove([subject.syllabus_file_url]);
  }

  return NextResponse.json({ ok: true });
}
