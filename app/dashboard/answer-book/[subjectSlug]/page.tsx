import { notFound } from "next/navigation";

import {
  SubjectTopicsShell,
  type UnitTopicGroup,
} from "@/components/answer-book/subject-topics-shell";
import type { TopicMaterialRowData } from "@/components/answer-book/topic-material-row";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

interface NotesRow {
  topic_id: string;
  content: string;
  summary: string | null;
  key_points: string[] | null;
  examples: string | null;
  qa: Json | null;
  is_saved: boolean;
  generated_at: string;
}

export default async function SubjectAnswerBookPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .eq("slug", subjectSlug)
    .single();

  if (!subject) {
    notFound();
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, title, unit_no, unit_title, difficulty")
    .eq("subject_id", subject.id)
    .order("unit_no", { ascending: true })
    .order("created_at", { ascending: true });

  const allTopics = topics ?? [];
  const topicIds = allTopics.map((t) => t.id);

  const { data: notesRows } =
    topicIds.length > 0
      ? await supabase
          .from("topic_notes")
          .select("topic_id, content, summary, key_points, examples, qa, is_saved, generated_at")
          .in("topic_id", topicIds)
      : { data: [] as NotesRow[] };

  const notesByTopicId = new Map((notesRows ?? []).map((n) => [n.topic_id, n as NotesRow]));

  const groupsMap = new Map<string, UnitTopicGroup>();
  for (const t of allTopics) {
    const key = `${t.unit_no ?? "none"}|${t.unit_title ?? ""}`;
    const group = groupsMap.get(key) ?? { unitNo: t.unit_no, unitTitle: t.unit_title, topics: [] };
    const note = notesByTopicId.get(t.id);

    const row: TopicMaterialRowData = {
      topicId: t.id,
      topicSlug: t.slug,
      topicTitle: t.title,
      difficulty: t.difficulty,
      isSaved: note?.is_saved ?? false,
      generated: Boolean(note),
      hasNotes: Boolean(note?.content && note.content.trim().length > 0),
      hasSummary: Boolean(note?.summary && note.summary.trim().length > 0),
      hasKeyPoints: Boolean(note?.key_points && note.key_points.length > 0),
      hasQa: Boolean(note && Array.isArray(note.qa) && note.qa.length > 0),
      hasExamples: Boolean(note?.examples && note.examples.trim().length > 0),
      generatedAt: note?.generated_at ?? null,
    };

    group.topics.push(row);
    groupsMap.set(key, group);
  }

  const groups = Array.from(groupsMap.values()).sort((a, b) => (a.unitNo ?? 0) - (b.unitNo ?? 0));

  return (
    <SubjectTopicsShell subjectName={subject.name} subjectSlug={subject.slug} groups={groups} />
  );
}
