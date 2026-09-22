import { NextResponse } from "next/server";

import { MAX_SYLLABUS_FILE_SIZE } from "@/lib/constants";
import { slugify, uniqueSlug } from "@/lib/slug";
import { processSyllabus } from "@/lib/syllabus/process";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const examDateRaw = String(formData.get("examDate") ?? "").trim();
  const file = formData.get("syllabus");

  if (!name) {
    return NextResponse.json({ error: "Subject name is required." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A syllabus PDF is required." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (file.size > MAX_SYLLABUS_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large. Max size is 10MB." }, { status: 400 });
  }

  // Daily study time (and breaks) are asked for after extraction — see
  // StudyPreferencesCard on the subject page — not upfront here, so the
  // question only comes up once the student knows what they're planning
  // around. The slot columns stay null until then.
  const { data: existingSubjects } = await supabase
    .from("subjects")
    .select("id, slug")
    .eq("user_id", user.id);

  const existingSlugs = new Set((existingSubjects ?? []).map((s) => s.slug));
  const slug = uniqueSlug(slugify(name), existingSlugs);

  const { data: subject, error: insertError } = await supabase
    .from("subjects")
    .insert({
      user_id: user.id,
      name,
      slug,
      exam_date: examDateRaw || null,
    })
    .select("id, slug")
    .single();

  if (insertError || !subject) {
    console.error("Failed to insert subject:", insertError);
    return NextResponse.json(
      { error: `Could not create the subject: ${insertError?.message ?? "unknown error"}` },
      { status: 500 },
    );
  }

  const storagePath = `${user.id}/${subject.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("syllabi")
    .upload(storagePath, file, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("Failed to upload syllabus:", uploadError);
    await supabase.from("subjects").delete().eq("id", subject.id);
    return NextResponse.json(
      { error: `Could not upload the file: ${uploadError.message}` },
      { status: 500 },
    );
  }

  await supabase.from("subjects").update({ syllabus_file_url: storagePath }).eq("id", subject.id);

  await processSyllabus(supabase, subject.id, storagePath);

  return NextResponse.json({ id: subject.id, slug: subject.slug });
}
