import Groq from "groq-sdk";

const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are an expert exam question writer. Given a numbered list of syllabus topics for a subject, generate a full-syllabus mock test.

Return STRICT JSON ONLY. No markdown, no code fences, no commentary before or after the JSON.

Match this exact shape:
{
  "questions": [
    { "topic_index": 0, "question": "...", "type": "mcq", "options": ["A", "B", "C", "D"], "correct_answer": "B", "explanation": "..." },
    { "topic_index": 3, "question": "...", "type": "short_answer", "correct_answer": "...", "explanation": "..." }
  ]
}

Rules:
- "topic_index" must be the 0-based index of the topic (from the numbered list given) that the question tests — every question must map to exactly one listed topic.
- Spread questions across as many different topics as possible instead of clustering on a few; aim for broad syllabus coverage.
- Mix "mcq" and "short_answer" types, mostly "mcq".
- For "mcq": "options" must have exactly 4 distinct choices, and "correct_answer" must be the exact text of one of the options — never a letter like "A" or "B".
- For "short_answer": omit "options", and keep "correct_answer" short (a few words, not a sentence) so it can be matched against a student's typed answer.
- Every question needs a brief "explanation" (1-2 sentences) of why the answer is correct.
- Base every question strictly on its mapped topic — do not invent unrelated content.
- Output nothing outside the JSON object.`;

export interface MockQuizTopic {
  id: string;
  title: string;
}

export interface RawMockQuestion {
  topic_index: number;
  question: string;
  type: "mcq" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface SanitizedMockQuestion {
  question: string;
  question_type: "mcq" | "short_answer";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
  topic_id: string;
}

export interface GenerateMockQuizParams {
  subjectName: string;
  topics: MockQuizTopic[];
  targetQuestionCount: number;
}

export interface GenerateMockQuizResult {
  questions?: SanitizedMockQuestion[];
  error?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParse(raw: string): RawMockQuestion[] | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    if (!parsed || !Array.isArray(parsed.questions)) return null;
    return parsed.questions as RawMockQuestion[];
  } catch {
    return null;
  }
}

function sanitizeQuestion(
  q: RawMockQuestion,
  index: number,
  topics: MockQuizTopic[],
): SanitizedMockQuestion | null {
  const topic = topics[q?.topic_index];
  if (!topic) return null;

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
      topic_id: topic.id,
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
      topic_id: topic.id,
    };
  }

  return null;
}

function sanitizeAll(raw: RawMockQuestion[], topics: MockQuizTopic[]): SanitizedMockQuestion[] {
  const sanitized: SanitizedMockQuestion[] = [];
  for (const q of raw) {
    const clean = sanitizeQuestion(q, sanitized.length, topics);
    if (clean) sanitized.push(clean);
  }
  return sanitized;
}

const UNAVAILABLE_ERROR =
  "The AI service is temporarily unavailable. Please try Regenerate in a moment.";

export async function generateMockQuizWithGroq(
  params: GenerateMockQuizParams,
): Promise<GenerateMockQuizResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const minUsable = Math.max(8, Math.round(params.targetQuestionCount * 0.6));

  const topicList = params.topics.map((t, i) => `${i}. ${t.title}`).join("\n");
  const userPrompt = [
    `Subject: ${params.subjectName}`,
    `Generate approximately ${params.targetQuestionCount} questions total, covering the full syllabus below.`,
    `Topics:`,
    topicList,
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
      max_completion_tokens: 8192,
      reasoning_effort: "low",
      reasoning_format: "hidden",
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch {
    return { error: UNAVAILABLE_ERROR };
  }

  let parsedRaw = tryParse(raw);
  let sanitized = parsedRaw ? sanitizeAll(parsedRaw, params.topics) : [];

  if (sanitized.length < minUsable) {
    try {
      const retryCompletion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        max_completion_tokens: 8192,
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
      sanitized = parsedRaw ? sanitizeAll(parsedRaw, params.topics) : [];
    } catch {
      return { error: UNAVAILABLE_ERROR };
    }
  }

  if (sanitized.length < minUsable) {
    return {
      error: "We couldn't generate a reliable mock test for this subject. Try again.",
    };
  }

  return { questions: sanitized };
}
