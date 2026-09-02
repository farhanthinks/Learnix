import { NextResponse } from "next/server";

import { generateMockQuizWithGroq } from "@/lib/ai/generate-mock-quiz";
import { generateQuizWithGroq } from "@/lib/ai/generate-quiz";
import { computeMockQuestionCount, computeMockTimeLimitMinutes } from "@/lib/quizzes/stats";
import { createClient } from "@/lib/supabase/server";

type StartBody =
  | { mode: "topic"; topicId: string }
  | { mode: "mock"; subjectId: string }
  | { mode: "retry"; attemptId: string };

function isStartBody(body: unknown): body is StartBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (b.mode === "topic") return typeof b.topicId === "string";
  if (b.mode === "mock") return typeof b.subjectId === "string";
  if (b.mode === "retry") return typeof b.attemptId === "string";
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isStartBody(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let quizId: string;
  let forceNewAttempt = false;

  if (body.mode === "retry") {
    const { data: priorAttempt } = await supabase
      .from("quiz_attempts")
      .select("quiz_id")
      .eq("id", body.attemptId)
      .eq("user_id", user.id)
      .single();
    if (!priorAttempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }
    quizId = priorAttempt.quiz_id;
    forceNewAttempt = true;
  } else if (body.mode === "topic") {
    const { data: existingQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("topic_id", body.topicId)
      .eq("quiz_type", "topic")
      .maybeSingle();

    if (existingQuiz) {
      quizId = existingQuiz.id;
    } else {
      const { data: topic } = await supabase
        .from("topics")
        .select("id, subject_id, title, unit_title, subtopics, difficulty")
        .eq("id", body.topicId)
        .single();
      if (!topic) {
        return NextResponse.json({ error: "Topic not found." }, { status: 404 });
      }

      const result = await generateQuizWithGroq({
        unitTitle: topic.unit_title ?? "",
        topicTitle: topic.title,
        subtopics: topic.subtopics ?? [],
        difficulty: topic.difficulty,
      });
      if (result.error || !result.questions) {
        return NextResponse.json(
          { error: result.error ?? "Could not generate a quiz." },
          { status: 502 },
        );
      }

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          topic_id: topic.id,
          subject_id: topic.subject_id,
          quiz_type: "topic",
          title: `${topic.title} Quiz`,
          difficulty: topic.difficulty,
          question_count: result.questions.length,
        })
        .select("id")
        .single();
      if (quizError || !quiz) {
        return NextResponse.json({ error: "Could not save the generated quiz." }, { status: 500 });
      }

      const rows = result.questions.map((q) => ({ ...q, quiz_id: quiz.id, topic_id: topic.id }));
      const { error: insertError } = await supabase.from("quiz_questions").insert(rows);
      if (insertError) {
        return NextResponse.json({ error: "Could not save the generated quiz." }, { status: 500 });
      }

      quizId = quiz.id;
    }
  } else {
    const { data: existingQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("subject_id", body.subjectId)
      .eq("quiz_type", "mock")
      .maybeSingle();

    if (existingQuiz) {
      quizId = existingQuiz.id;
    } else {
      const [{ data: subject }, { data: topics }] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", body.subjectId).single(),
        supabase.from("topics").select("id, title").eq("subject_id", body.subjectId),
      ]);
      if (!subject || !topics || topics.length === 0) {
        return NextResponse.json({ error: "Subject not found." }, { status: 404 });
      }

      const targetQuestionCount = computeMockQuestionCount(topics.length);
      const result = await generateMockQuizWithGroq({
        subjectName: subject.name,
        topics: topics.map((t) => ({ id: t.id, title: t.title })),
        targetQuestionCount,
      });
      if (result.error || !result.questions) {
        return NextResponse.json(
          { error: result.error ?? "Could not generate a mock test." },
          { status: 502 },
        );
      }

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          subject_id: subject.id,
          quiz_type: "mock",
          title: `${subject.name} Mock Test`,
          time_limit_minutes: computeMockTimeLimitMinutes(result.questions.length),
          question_count: result.questions.length,
        })
        .select("id")
        .single();
      if (quizError || !quiz) {
        return NextResponse.json(
          { error: "Could not save the generated mock test." },
          { status: 500 },
        );
      }

      const rows = result.questions.map((q) => ({ ...q, quiz_id: quiz.id }));
      const { error: insertError } = await supabase.from("quiz_questions").insert(rows);
      if (insertError) {
        return NextResponse.json(
          { error: "Could not save the generated mock test." },
          { status: 500 },
        );
      }

      quizId = quiz.id;
    }
  }

  if (!forceNewAttempt) {
    const { data: incompleteAttempt } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (incompleteAttempt) {
      return NextResponse.json({ attemptId: incompleteAttempt.id });
    }
  }

  const { data: questionRows } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      total_questions: questionRows?.length ?? 0,
      is_completed: false,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Could not start the quiz." }, { status: 500 });
  }

  return NextResponse.json({ attemptId: attempt.id });
}
