import { redirect } from "next/navigation";

import {
  AnswerBookLibraryShell,
  type AnswerBookLibrarySubject,
} from "@/components/answer-book/answer-book-library-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AnswerBookLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: subjects }, { data: topics }, { data: notesRows }] = await Promise.all([
    supabase.from("subjects").select("id, slug, name").eq("user_id", user.id).order("name"),
    supabase.from("topics").select("id, subject_id, title"),
    supabase.from("topic_notes").select("topic_id"),
  ]);

  const allTopics = topics ?? [];
  const generatedTopicIds = new Set((notesRows ?? []).map((n) => n.topic_id));

  const librarySubjects: AnswerBookLibrarySubject[] = (subjects ?? [])
    .map((s) => {
      const subjectTopics = allTopics.filter((t) => t.subject_id === s.id);
      return {
        slug: s.slug,
        name: s.name,
        topicsTotal: subjectTopics.length,
        materialsGenerated: subjectTopics.filter((t) => generatedTopicIds.has(t.id)).length,
        topicTitles: subjectTopics.map((t) => t.title),
      };
    })
    .filter((s) => s.topicsTotal > 0);

  return <AnswerBookLibraryShell subjects={librarySubjects} />;
}
