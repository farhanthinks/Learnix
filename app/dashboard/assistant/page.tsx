import { redirect } from "next/navigation";

import { AssistantShell, type AssistantSubjectData } from "@/components/assistant/assistant-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase.from("topics").select("id, subject_id, title, unit_no").order("unit_no"),
  ]);

  const topicsBySubject = new Map<string, string[]>();
  for (const t of topics ?? []) {
    const list = topicsBySubject.get(t.subject_id) ?? [];
    list.push(t.title);
    topicsBySubject.set(t.subject_id, list);
  }

  const assistantSubjects: AssistantSubjectData[] = (subjects ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    topicTitles: topicsBySubject.get(s.id) ?? [],
  }));

  return <AssistantShell subjects={assistantSubjects} />;
}
