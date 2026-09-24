import { notFound } from "next/navigation";

import { AnswerBookShell, type TopicNotesData } from "@/components/answer-book/answer-book-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AnswerBookPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
}) {
  const { subjectSlug, topicSlug } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .eq("slug", subjectSlug)
    .single();

  if (!subject) {
    notFound();
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", topicSlug)
    .eq("subject_id", subject.id)
    .single();

  if (!topic) {
    notFound();
  }

  const { data: notesRow } = await supabase
    .from("topic_notes")
    .select(
      "content, summary, key_points, examples, qa, textbook_references, is_saved, generated_at",
    )
    .eq("topic_id", topic.id)
    .maybeSingle();

  const initialNotes: TopicNotesData | null = notesRow
    ? {
        content: notesRow.content,
        summary: notesRow.summary ?? "",
        keyPoints: notesRow.key_points ?? [],
        examples: notesRow.examples ?? "",
        qa: Array.isArray(notesRow.qa)
          ? (notesRow.qa as unknown as { question: string; answer: string }[])
          : [],
        textbookReferences: notesRow.textbook_references ?? [],
        generatedAt: notesRow.generated_at,
        isSaved: notesRow.is_saved,
      }
    : null;

  return (
    <AnswerBookShell
      subjectSlug={subject.slug}
      subjectName={subject.name}
      topic={{
        id: topic.id,
        title: topic.title,
        unitTitle: topic.unit_title,
        subtopics: topic.subtopics,
        difficulty: topic.difficulty,
      }}
      initialNotes={initialNotes}
    />
  );
}
