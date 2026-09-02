import { NextResponse } from "next/server";

import { MAX_SYLLABUS_FILE_SIZE } from "@/lib/constants";
import { findSlotConflict, formatConflictMessage } from "@/lib/scheduling/slot-conflict";
import { slugify, uniqueSlug } from "@/lib/slug";
import { processSyllabus } from "@/lib/syllabus/process";
import { createClient } from "@/lib/supabase/server";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const VALID_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
  const slotStartTime = String(formData.get("slotStartTime") ?? "");
  const slotEndTime = String(formData.get("slotEndTime") ?? "");
  const slotDays = formData
    .getAll("slotDays")
    .map(String)
    .filter((d) => VALID_DAYS.includes(d));

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
  if (!TIME_RE.test(slotStartTime) || !TIME_RE.test(slotEndTime)) {
    return NextResponse.json(
      { error: "Please set a valid daily study start and end time." },
      {
        status: 400,
      },
    );
  }
  if (slotStartTime >= slotEndTime) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }
  if (slotDays.length === 0) {
    return NextResponse.json({ error: "Please select at least one study day." }, { status: 400 });
  }

  const { data: existingSubjects } = await supabase
    .from("subjects")
    .select("id, name, slug, slot_start_time, slot_end_time, slot_days")
    .eq("user_id", user.id);

  const conflict = findSlotConflict(
    { startTime: slotStartTime, endTime: slotEndTime, days: slotDays },
    existingSubjects ?? [],
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

  const existingSlugs = new Set((existingSubjects ?? []).map((s) => s.slug));
  const slug = uniqueSlug(slugify(name), existingSlugs);

  const { data: subject, error: insertError } = await supabase
    .from("subjects")
    .insert({
      user_id: user.id,
      name,
      slug,
      exam_date: examDateRaw || null,
      slot_start_time: slotStartTime,
      slot_end_time: slotEndTime,
      slot_days: slotDays,
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
