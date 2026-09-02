import Groq from "groq-sdk";

const MODEL = "openai/gpt-oss-120b";
const MIN_STUDY_NOTES_LENGTH = 80;

const SYSTEM_PROMPT = `You are an expert tutor building a study reference for one syllabus topic. Return STRICT JSON ONLY — no markdown fences, no commentary before or after.

Match this exact shape:
{
  "studyNotes": "...",
  "summary": "...",
  "keyPoints": ["...", "..."],
  "examples": "...",
  "qa": [{ "question": "...", "answer": "..." }]
}

Field rules:
- "studyNotes": Markdown. Start with a "#" heading (the topic title), then one "##" heading per subtopic with a clear explanation and key definitions, bullet points for important facts/formulas where relevant. Dense and useful for revision — no filler, no "in conclusion" padding.
- "summary": Markdown, 3-6 sentences — a tight exam-focused summary a student could read in under a minute.
- "keyPoints": 5-8 short strings — important facts, definitions, formulas, or terminology. Each one sentence or a short phrase, no numbering.
- "examples": Markdown — 2-4 concrete, practical, real-world examples or worked applications of this topic. Use "##" sub-headings per example if there's more than one.
- "qa": 4-6 likely exam questions with concise but complete answers (2-4 sentences each).

Base everything strictly on the given topic and subtopics — do not invent unrelated content. Output nothing outside the JSON object.`;

export interface GenerateNotesParams {
  unitTitle: string;
  topicTitle: string;
  subtopics: string[];
  difficulty: string;
}

export interface GeneratedNotesContent {
  studyNotes: string;
  summary: string;
  keyPoints: string[];
  examples: string;
  qa: { question: string; answer: string }[];
}

export interface GenerateNotesResult {
  data?: GeneratedNotesContent;
  error?: string;
}

interface RawNotesContent {
  studyNotes?: string;
  summary?: string;
  keyPoints?: unknown;
  examples?: string;
  qa?: unknown;
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParse(raw: string): RawNotesContent | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as RawNotesContent;
  } catch {
    return null;
  }
}

function sanitize(raw: RawNotesContent | null): GeneratedNotesContent | null {
  if (!raw) return null;

  const studyNotes = raw.studyNotes?.trim();
  if (!studyNotes || studyNotes.length < MIN_STUDY_NOTES_LENGTH) return null;

  const summary = raw.summary?.trim() || "";
  const examples = raw.examples?.trim() || "";

  const keyPoints = Array.isArray(raw.keyPoints)
    ? raw.keyPoints
        .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
        .map((k) => k.trim())
    : [];

  const qa = Array.isArray(raw.qa)
    ? raw.qa
        .filter(
          (q): q is { question: string; answer: string } =>
            typeof q === "object" &&
            q !== null &&
            typeof (q as Record<string, unknown>).question === "string" &&
            typeof (q as Record<string, unknown>).answer === "string" &&
            (q as { question: string }).question.trim().length > 0 &&
            (q as { answer: string }).answer.trim().length > 0,
        )
        .map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }))
    : [];

  return { studyNotes, summary, keyPoints, examples, qa };
}

const UNAVAILABLE_ERROR =
  "The AI service is temporarily unavailable. Please try Regenerate in a moment.";

export async function generateTopicNotes(
  params: GenerateNotesParams,
): Promise<GenerateNotesResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const userPrompt = [
    `Unit: ${params.unitTitle || "(untitled)"}`,
    `Topic: ${params.topicTitle}`,
    `Difficulty: ${params.difficulty}`,
    `Subtopics: ${
      params.subtopics.length > 0
        ? params.subtopics.join(", ")
        : "(none listed — use your judgement based on the topic title)"
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
  } catch {
    return { error: UNAVAILABLE_ERROR };
  }

  let data = sanitize(tryParse(raw));

  if (!data) {
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
              "Your previous response was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no markdown, no explanation.",
          },
        ],
      });
      const retryRaw = retryCompletion.choices[0]?.message?.content ?? "";
      data = sanitize(tryParse(retryRaw));
    } catch {
      return { error: UNAVAILABLE_ERROR };
    }
  }

  if (!data) {
    return { error: "The AI didn't return usable notes. Please try Regenerate." };
  }

  return { data };
}
