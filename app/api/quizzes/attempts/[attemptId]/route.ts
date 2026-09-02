import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const update: {
    current_question_index?: number;
    answers?: Json;
    flagged_questions?: Json;
  } = {};

  if (typeof body.currentQuestionIndex === "number") {
    update.current_question_index = body.currentQuestionIndex;
  }
  if (body.answers && typeof body.answers === "object") {
    update.answers = body.answers as Json;
  }
  if (Array.isArray(body.flaggedQuestions)) {
    update.flagged_questions = body.flaggedQuestions as Json;
  }

  const { error } = await supabase
    .from("quiz_attempts")
    .update(update)
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if (error) {
    return NextResponse.json({ error: "Could not save progress." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
