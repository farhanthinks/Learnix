import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [{ data: profile }, { data: subjects }, { data: topics }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, college_name, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subjects")
      .select("id, name, exam_date, extraction_status, created_at")
      .eq("user_id", user.id),
    supabase.from("topics").select("id, subject_id, title, unit_title, difficulty, status"),
  ]);

  const topicIds = (topics ?? []).map((t) => t.id);
  const subjectIds = (subjects ?? []).map((s) => s.id);

  const [{ data: notes }, { data: quizzes }, { data: studyPlans }, { data: sessions }] =
    await Promise.all([
      topicIds.length > 0
        ? supabase
            .from("topic_notes")
            .select("topic_id, content, summary, key_points, examples, qa, generated_at")
            .in("topic_id", topicIds)
        : Promise.resolve({ data: [] }),
      subjectIds.length > 0
        ? supabase
            .from("quizzes")
            .select("id, topic_id, subject_id, quiz_type, title, generated_at")
            .in("subject_id", subjectIds)
        : Promise.resolve({ data: [] }),
      subjectIds.length > 0
        ? supabase
            .from("study_plans")
            .select("topic_id, scheduled_date, planned_minutes")
            .in("subject_id", subjectIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("study_sessions")
        .select("topic_id, started_at, ended_at, duration_minutes")
        .eq("user_id", user.id),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, ...profile },
    subjects: subjects ?? [],
    topics: topics ?? [],
    topicNotes: notes ?? [],
    quizzes: quizzes ?? [],
    studyPlanEntries: studyPlans ?? [],
    studySessions: sessions ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="learnix-data-export.json"`,
    },
  });
}
