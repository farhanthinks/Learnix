import type { SupabaseClient } from "@supabase/supabase-js";

import { extractTopicsWithGroq, type ExtractedUnit } from "@/lib/ai/extract-topics";
import { extractSyllabusText } from "@/lib/pdf/extract-text";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type TopicInsert = Database["public"]["Tables"]["topics"]["Insert"];

const ALLOWED_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/**
 * Downloads the stored syllabus PDF, extracts its text, asks Groq to structure
 * it into units/topics, and (re-)populates the topics table. Used for both the
 * initial upload and the "Re-extract" retry, since both start from the same
 * stored file.
 */
export async function processSyllabus(
  supabase: Client,
  subjectId: string,
  storagePath: string,
): Promise<void> {
  await supabase
    .from("subjects")
    .update({ extraction_status: "processing", extraction_error: null })
    .eq("id", subjectId);

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("syllabi")
    .download(storagePath);

  if (downloadError || !fileBlob) {
    await failExtraction(
      supabase,
      subjectId,
      "Could not read the uploaded file. Please try Re-extract.",
    );
    return;
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const extracted = await extractSyllabusText(buffer);

  if (extracted.error || !extracted.text) {
    await failExtraction(supabase, subjectId, extracted.error ?? "Could not read this PDF.");
    return;
  }

  const aiResult = await extractTopicsWithGroq(extracted.text);

  if (aiResult.error || !aiResult.data) {
    await failExtraction(
      supabase,
      subjectId,
      aiResult.error ?? "We couldn't extract topics from this syllabus.",
    );
    return;
  }

  const rows = flattenUnits(subjectId, aiResult.data.units);

  // Clear any previous topics — covers both the first run and re-extraction.
  await supabase.from("topics").delete().eq("subject_id", subjectId);

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("topics").insert(rows);
    if (insertError) {
      await failExtraction(
        supabase,
        subjectId,
        "Failed to save the extracted topics. Please try Re-extract.",
      );
      return;
    }
  }

  await supabase
    .from("subjects")
    .update({
      extraction_status: "done",
      extraction_error: null,
      extraction_warning: extracted.truncated
        ? "This syllabus was long, so only the first section was processed — some topics may be missing."
        : null,
    })
    .eq("id", subjectId);
}

async function failExtraction(supabase: Client, subjectId: string, message: string) {
  await supabase
    .from("subjects")
    .update({ extraction_status: "failed", extraction_error: message })
    .eq("id", subjectId);
}

function flattenUnits(subjectId: string, units: ExtractedUnit[]): TopicInsert[] {
  const rows: TopicInsert[] = [];
  // Slugs only need to be unique within this subject, and the topics table
  // for this subject is fully replaced right before insert — so tracking
  // collisions within this one batch is sufficient, no DB lookup needed.
  const usedSlugs = new Set<string>();

  units.forEach((unit, unitIdx) => {
    const unitNo = Number.isFinite(unit.unit_no) ? unit.unit_no : unitIdx + 1;
    const unitTitle = (unit.title || `Unit ${unitNo}`).trim().slice(0, 200);

    for (const topic of unit.topics ?? []) {
      const title = topic?.title?.trim();
      if (!title) continue;

      const difficulty = ALLOWED_DIFFICULTIES.has(topic.difficulty ?? "")
        ? (topic.difficulty as "easy" | "medium" | "hard")
        : "medium";

      const subtopics = Array.isArray(topic.subtopics)
        ? topic.subtopics
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim())
        : [];

      const slug = uniqueSlug(slugify(title), usedSlugs);
      usedSlugs.add(slug);

      rows.push({
        subject_id: subjectId,
        slug,
        unit_no: unitNo,
        unit_title: unitTitle,
        title: title.slice(0, 300),
        subtopics,
        difficulty,
      });
    }
  });

  return rows;
}
