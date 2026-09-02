import { redirect } from "next/navigation";

import type { MaterialRowData } from "@/components/answer-book/material-row";
import type { SubjectLibraryData } from "@/components/answer-book/subject-material-card";
import { LibraryShell, type LibrarySummary } from "@/components/answer-book/library-shell";
import { createClient } from "@/lib/supabase/server";
import type { Json, TopicDifficulty } from "@/types/database";

const RECENT_MATERIALS_PER_SUBJECT = 4;
const RECENT_SECTION_LIMIT = 6;

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

export default async function AnswerBookLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: subjects }, { data: topics }, { data: notesRows }, { data: sessions }] =
    await Promise.all([
      supabase.from("subjects").select("id, slug, name").eq("user_id", user.id).order("name"),
      supabase.from("topics").select("id, subject_id, slug, title, difficulty"),
      supabase
        .from("topic_notes")
        .select("topic_id, content, summary, key_points, examples, qa, is_saved, generated_at"),
      supabase
        .from("study_sessions")
        .select("topic_id, started_at")
        .order("started_at", { ascending: false }),
    ]);

  const allTopics = topics ?? [];
  const allNotes: NotesRow[] = notesRows ?? [];

  const topicById = new Map(allTopics.map((t) => [t.id, t]));
  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const notesByTopicId = new Map(allNotes.map((n) => [n.topic_id, n]));

  function toMaterial(note: NotesRow): MaterialRowData | null {
    const topic = topicById.get(note.topic_id);
    if (!topic) return null;
    const subject = subjectById.get(topic.subject_id);
    if (!subject) return null;
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      subjectName: subject.name,
      subjectSlug: subject.slug,
      topicSlug: topic.slug,
      difficulty: topic.difficulty as TopicDifficulty,
      generatedAt: note.generated_at,
      isSaved: note.is_saved,
    };
  }

  const subjectLibrary: SubjectLibraryData[] = (subjects ?? [])
    .map((s) => {
      const subjectTopics = allTopics.filter((t) => t.subject_id === s.id);
      const notesForSubject = subjectTopics
        .map((t) => notesByTopicId.get(t.id))
        .filter((n): n is NotesRow => Boolean(n))
        .sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));

      const categoryCounts = {
        studyNotes: notesForSubject.filter((n) => n.content.trim().length > 0).length,
        summaries: notesForSubject.filter((n) => (n.summary ?? "").trim().length > 0).length,
        keyPoints: notesForSubject.filter((n) => (n.key_points ?? []).length > 0).length,
        qa: notesForSubject.filter((n) => Array.isArray(n.qa) && n.qa.length > 0).length,
      };

      const recentMaterials = notesForSubject
        .slice(0, RECENT_MATERIALS_PER_SUBJECT)
        .map(toMaterial)
        .filter((m): m is MaterialRowData => m !== null);

      return {
        slug: s.slug,
        name: s.name,
        topicsTotal: subjectTopics.length,
        materialsGenerated: notesForSubject.length,
        categoryCounts,
        recentMaterials,
      };
    })
    .filter((s) => s.topicsTotal > 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const summary: LibrarySummary = {
    totalNotes: allNotes.length,
    subjectsCovered: new Set(
      allNotes
        .map((n) => topicById.get(n.topic_id)?.subject_id)
        .filter((id): id is string => Boolean(id)),
    ).size,
    recentlyGenerated: allNotes.filter((n) => n.generated_at >= sevenDaysAgoIso).length,
    savedCount: allNotes.filter((n) => n.is_saved).length,
  };

  const recentlyGenerated: MaterialRowData[] = [...allNotes]
    .sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1))
    .slice(0, RECENT_SECTION_LIMIT)
    .map(toMaterial)
    .filter((m): m is MaterialRowData => m !== null);

  const savedMaterials: MaterialRowData[] = allNotes
    .filter((n) => n.is_saved)
    .sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1))
    .slice(0, RECENT_SECTION_LIMIT)
    .map(toMaterial)
    .filter((m): m is MaterialRowData => m !== null);

  // "Recently viewed" is approximated from real study_sessions activity
  // (starting a topic implies opening it) — there's no separate view-log.
  const seenTopicIds = new Set<string>();
  const recentlyViewed: MaterialRowData[] = [];
  for (const session of sessions ?? []) {
    if (seenTopicIds.has(session.topic_id)) continue;
    seenTopicIds.add(session.topic_id);
    const note = notesByTopicId.get(session.topic_id);
    if (!note) continue;
    const material = toMaterial(note);
    if (material) recentlyViewed.push(material);
    if (recentlyViewed.length >= RECENT_SECTION_LIMIT) break;
  }

  return (
    <LibraryShell
      summary={summary}
      subjects={subjectLibrary}
      recentlyViewed={recentlyViewed}
      recentlyGenerated={recentlyGenerated}
      savedMaterials={savedMaterials}
    />
  );
}
