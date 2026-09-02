import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/** Opens a new session for a topic, unless one is already open. */
export async function startSession(supabase: Client, userId: string, topicId: string) {
  const { data: openSession } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("topic_id", topicId)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  if (openSession) return;

  await supabase.from("study_sessions").insert({
    user_id: userId,
    topic_id: topicId,
    started_at: new Date().toISOString(),
  });
}

/** Closes whatever session is currently open for a topic, if any. */
export async function closeOpenSession(supabase: Client, topicId: string) {
  const { data: openSession } = await supabase
    .from("study_sessions")
    .select("id, started_at")
    .eq("topic_id", topicId)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  if (!openSession) return;

  const endedAt = new Date();
  const startedAt = new Date(openSession.started_at);
  const durationMinutes = Math.max(
    0,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000),
  );

  await supabase
    .from("study_sessions")
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
    .eq("id", openSession.id);
}
