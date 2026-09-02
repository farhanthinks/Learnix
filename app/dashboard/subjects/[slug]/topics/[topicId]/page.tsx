import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// The AI Answer Book (/dashboard/answer-book/[subjectSlug]/[topicSlug])
// replaced this page as the real destination for topic content. This route
// stays alive purely as a redirect so any link still pointing at the old
// UUID-based URL (bookmarks, or a spot this migration didn't reach) keeps
// working instead of 404ing.
export default async function TopicRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}) {
  const { slug, topicId } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (!subject) {
    notFound();
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("slug")
    .eq("id", topicId)
    .eq("subject_id", subject.id)
    .single();

  if (!topic) {
    notFound();
  }

  redirect(`/dashboard/answer-book/${subject.slug}/${topic.slug}`);
}
