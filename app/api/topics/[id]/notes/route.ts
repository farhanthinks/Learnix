import { NextResponse } from "next/server";

import { generateTopicNotes } from "@/lib/ai/generate-notes";
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

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, unit_title, subtopics, difficulty")
    .eq("id", id)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const result = await generateTopicNotes({
    unitTitle: topic.unit_title ?? "",
    topicTitle: topic.title,
    subtopics: topic.subtopics ?? [],
    difficulty: topic.difficulty,
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "Could not generate notes." },
      { status: 502 },
    );
  }

  const { data } = result;
  const { data: existing } = await supabase
    .from("topic_notes")
    .select("id")
    .eq("topic_id", id)
    .maybeSingle();

  const row = {
    content: data.studyNotes,
    summary: data.summary,
    key_points: data.keyPoints,
    examples: data.examples,
    qa: data.qa,
    textbook_references: data.textbookReferences,
    generated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("topic_notes").update(row).eq("id", existing.id);
  } else {
    await supabase.from("topic_notes").insert({ topic_id: id, ...row });
  }

  // Regenerating an already-saved item shouldn't silently unsave it, so
  // read back the real is_saved value rather than assuming false.
  const { data: saved } = await supabase
    .from("topic_notes")
    .select("is_saved")
    .eq("topic_id", id)
    .single();

  return NextResponse.json({ ok: true, notes: { ...row, is_saved: saved?.is_saved ?? false } });
}

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
  if (typeof body?.isSaved !== "boolean") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { error } = await supabase
    .from("topic_notes")
    .update({ is_saved: body.isSaved })
    .eq("topic_id", id);

  if (error) {
    return NextResponse.json({ error: "Could not update." }, { status: 500 });
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

  const { error } = await supabase.from("topic_notes").delete().eq("topic_id", id);
  if (error) {
    return NextResponse.json({ error: "Could not clear notes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
