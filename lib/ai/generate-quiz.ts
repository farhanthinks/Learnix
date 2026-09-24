import Groq from "groq-sdk";

import { describeGroqError } from "@/lib/ai/groq-error";

const MODEL = "openai/gpt-oss-120b";
const MIN_USABLE_QUESTIONS = 3;

const SYSTEM_PROMPT = `You are an expert exam question writer. Given a syllabus topic, generate a self-test quiz.

Return STRICT JSON ONLY. No markdown, no code fences, no commentary before or after the JSON.

Match this exact shape:
{
  "questions": [
    { "question": "...", "type": "mcq", "options": ["A", "B", "C", "D"], "correct_answer": "B", "explanation": "..." },
    { "question": "...", "type": "short_answer", "correct_answer": "...", "explanation": "..." }
  ]
}

Rules:
- Produce between 5 and 8 questions total.
- Mix both "mcq" and "short_answer" types — include at least 2 of each.
- For "mcq": "options" must have exactly 4 distinct choices, and "correct_answer" must be the exact text of one of the options — never a letter like "A" or "B".
- For "short_answer": omit "options", and keep "correct_answer" short (a few words, not a sentence) so it can be matched against a student's typed answer.
- Every question needs a brief "explanation" (1-2 sentences) of why the answer is correct.
- Base every question strictly on the given topic and subtopics — do not invent unrelated content.
- Output nothing outside the JSON object.`;

export interface RawQuizQuestion {
  question: string;
  type: "mcq" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface SanitizedQuizQuestion {
  question: string;
  question_type: "mcq" | "short_answer";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

export interface GenerateQuizParams {
  unitTitle: string;
  topicTitle: string;
  subtopics: string[];
  difficulty: string;
}

export interface GenerateQuizResult {
  questions?: SanitizedQuizQuestion[];
  error?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParse(raw: string): RawQuizQuestion[] | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    if (!parsed || !Array.isArray(parsed.questions)) return null;
    return parsed.questions as RawQuizQuestion[];
  } catch {
    return null;
  }
}

function sanitizeQuestion(q: RawQuizQuestion, index: number): SanitizedQuizQuestion | null {
  const question = q?.question?.trim();
  const rawCorrectAnswer = q?.correct_answer?.trim();
  if (!question || !rawCorrectAnswer) return null;

  const explanation = q.explanation?.trim() || null;

  if (q.type === "mcq") {
    const options = Array.isArray(q.options)
      ? q.options
          .filter((o): o is string => typeof o === "string" && o.trim().length > 0)
          .map((o) => o.trim())
      : [];
    if (options.length < 2) return null;

    let correctAnswer = rawCorrectAnswer;
    const letterMatch = /^[A-D]$/i.exec(correctAnswer);
    if (letterMatch && !options.includes(correctAnswer)) {
      const idx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
      if (options[idx]) correctAnswer = options[idx];
    }
    if (!options.includes(correctAnswer)) return null;

    return {
      question,
      question_type: "mcq",
      options,
      correct_answer: correctAnswer,
      explanation,
      order_index: index,
    };
  }

  if (q.type === "short_answer") {
    return {
      question,
      question_type: "short_answer",
      options: null,
      correct_answer: rawCorrectAnswer,
      explanation,
      order_index: index,
    };
  }

  return null;
}

function sanitizeAll(raw: RawQuizQuestion[]): SanitizedQuizQuestion[] {
  const sanitized: SanitizedQuizQuestion[] = [];
  for (const q of raw) {
    const clean = sanitizeQuestion(q, sanitized.length);
    if (clean) sanitized.push(clean);
  }
  return sanitized;
}

export async function generateQuizWithGroq(
  params: GenerateQuizParams,
): Promise<GenerateQuizResult> {
  let groq: Groq;
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    return { error: describeGroqError(err, "generate-quiz").error };
  }

  const userPrompt = [
    `Unit: ${params.unitTitle || "(untitled)"}`,
    `Topic: ${params.topicTitle}`,
    `Difficulty: ${params.difficulty}`,
    `Subtopics: ${
      params.subtopics.length > 0
        ? params.subtopics.join(", ")
        : "(none listed — use the topic title)"
    }`,
  ].join("\n");

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  let raw: string;
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_completion_tokens: 4096,
      reasoning_effort: "low",
      reasoning_format: "hidden",
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    return { error: describeGroqError(err, "generate-quiz").error };
  }

  let parsedRaw = tryParse(raw);
  let sanitized = parsedRaw ? sanitizeAll(parsedRaw) : [];

  if (sanitized.length < MIN_USABLE_QUESTIONS) {
    try {
      const retryCompletion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        max_completion_tokens: 4096,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        messages: [
          ...messages,
          { role: "assistant", content: raw },
          {
            role: "user",
            content:
              "Your previous response was not valid JSON matching the required shape (or produced too few usable questions). Reply again with ONLY the corrected JSON object — no markdown, no explanation.",
          },
        ],
      });
      const retryRaw = retryCompletion.choices[0]?.message?.content ?? "";
      parsedRaw = tryParse(retryRaw);
      sanitized = parsedRaw ? sanitizeAll(parsedRaw) : [];
    } catch (err) {
      return { error: describeGroqError(err, "generate-quiz").error };
    }
  }

  if (sanitized.length < MIN_USABLE_QUESTIONS) {
    return {
      error: "We couldn't generate a reliable quiz for this topic. Try Regenerate.",
    };
  }

  return { questions: sanitized };
}
