import { notFound } from "next/navigation";

import { AnswerBookShell, type TopicNotesData } from "@/components/answer-book/answer-book-shell";
import type { AttemptSummary } from "@/components/topics/quiz-panel";
import { createClient } from "@/lib/supabase/server";
import type { QuizQuestion } from "@/types/database";

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

  const [{ data: notesRow }, { data: quiz }, { data: sessions }] = await Promise.all([
    supabase
      .from("topic_notes")
      .select("content, summary, key_points, examples, qa, is_saved, generated_at")
      .eq("topic_id", topic.id)
      .maybeSingle(),
    supabase.from("quizzes").select("id").eq("topic_id", topic.id).maybeSingle(),
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("topic_id", topic.id)
      .not("duration_minutes", "is", null),
  ]);

  const initialNotes: TopicNotesData | null = notesRow
    ? {
        content: notesRow.content,
        summary: notesRow.summary ?? "",
        keyPoints: notesRow.key_points ?? [],
        examples: notesRow.examples ?? "",
        qa: Array.isArray(notesRow.qa)
          ? (notesRow.qa as unknown as { question: string; answer: string }[])
          : [],
        generatedAt: notesRow.generated_at,
        isSaved: notesRow.is_saved,
      }
    : null;

  let questions: QuizQuestion[] = [];
  let attemptSummary: AttemptSummary | null = null;

  if (quiz) {
    const { data: questionRows } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("order_index", { ascending: true });
    questions = questionRows ?? [];

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score, total_questions, completed_at")
      .eq("quiz_id", quiz.id)
      .eq("is_completed", true)
      .order("completed_at", { ascending: false });

    if (attempts && attempts.length > 0) {
      const best = attempts.reduce((a, b) => (b.score > a.score ? b : a));
      attemptSummary = {
        bestScore: best.score,
        total: best.total_questions,
        lastAttemptAt: attempts[0].completed_at ?? new Date().toISOString(),
      };
    }
  }

  const timeSpentMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  return (
    <AnswerBookShell
      subjectSlug={subject.slug}
      subjectName={subject.name}
      subjectId={subject.id}
      topic={{
        id: topic.id,
        title: topic.title,
        unitTitle: topic.unit_title,
        subtopics: topic.subtopics,
        difficulty: topic.difficulty,
        status: topic.status,
      }}
      initialNotes={initialNotes}
      quiz={quiz ? { id: quiz.id } : null}
      questions={questions}
      attemptSummary={attemptSummary}
      timeSpentMinutes={timeSpentMinutes}
    />
  );
}
