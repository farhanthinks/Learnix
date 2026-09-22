import { redirect } from "next/navigation";

import {
  QuizzesLibraryShell,
  type QuizzesLibrarySubject,
} from "@/components/quizzes/quizzes-library-shell";
import { createClient } from "@/lib/supabase/server";

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: subjects }, { data: topics }, { data: quizzes }] = await Promise.all([
    supabase.from("subjects").select("id, slug, name").eq("user_id", user.id).order("name"),
    supabase.from("topics").select("id, subject_id, title"),
    supabase.from("quizzes").select("id, subject_id, topic_id, quiz_type"),
  ]);

  const allTopics = topics ?? [];
  const quizzedTopicIds = new Set(
    (quizzes ?? [])
      .filter((q) => q.quiz_type === "topic" && q.topic_id)
      .map((q) => q.topic_id as string),
  );

  const librarySubjects: QuizzesLibrarySubject[] = (subjects ?? [])
    .map((s) => {
      const subjectTopics = allTopics.filter((t) => t.subject_id === s.id);
      return {
        slug: s.slug,
        name: s.name,
        topicsTotal: subjectTopics.length,
        quizzesGenerated: subjectTopics.filter((t) => quizzedTopicIds.has(t.id)).length,
        topicTitles: subjectTopics.map((t) => t.title),
      };
    })
    .filter((s) => s.topicsTotal > 0);

  return <QuizzesLibraryShell subjects={librarySubjects} />;
}
