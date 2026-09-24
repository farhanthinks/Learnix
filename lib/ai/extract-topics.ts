import Groq from "groq-sdk";

import { describeGroqError } from "@/lib/ai/groq-error";

// Groq deprecated the Llama 3.1/3.3 models; gpt-oss-120b is the current
// best-available option in this catalog for structured extraction.
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are a faithful syllabus transcriber. Your only job is to convert raw syllabus text into structured JSON that represents EVERY topic and sub-topic exactly as the source lists them. The syllabus text is the source of truth — you are not summarizing it, condensing it, or writing a study guide. You are transcribing its structure.

Return STRICT JSON ONLY. No markdown, no code fences, no commentary before or after the JSON.

Match this exact shape:
{
  "units": [
    {
      "unit_no": 1,
      "title": "Unit title",
      "topics": [
        { "title": "Topic title", "subtopics": ["short clarifying detail"], "difficulty": "easy" }
      ]
    }
  ]
}

THE CRITICAL RULE — READ CAREFULLY:
Every topic AND every sub-topic that appears as its own explicit item in the syllabus (its own bullet, its own comma/arrow-separated entry, its own heading, its own numbered line) must become its own SEPARATE object in the "topics" array. Never fold several explicitly-listed items into one topic and push the rest into "subtopics". "subtopics" exists ONLY for genuinely unenumerated detail — a short parenthetical or descriptive fragment that is NOT itself listed as a separate item. If the syllabus lists something as its own item, it gets its own "topics" entry, full stop — it never becomes a string inside another topic's "subtopics" array.

Worked example — if the syllabus contains a line like:
  "Type of Data: Numeric, Categorical, Graphical, High Dimensional Data"
this is FIVE separate topics, not one:
  { "title": "Type of Data", ... }
  { "title": "Numeric", ... }
  { "title": "Categorical", ... }
  { "title": "Graphical", ... }
  { "title": "High Dimensional Data", ... }

WRONG (never do this):
  { "title": "Type of Data", "subtopics": ["Numeric", "Categorical", "Graphical", "High Dimensional Data"], ... }
That merges four explicitly-listed topics into one and hides them — forbidden.

More rules:
- Do not invent broad, generic, or AI-sounding topic names (e.g. "Big Data Overview", "Introduction to Concepts") when the syllabus already lists specific topics — use the syllabus's own specific items instead.
- Do not omit any topic the syllabus lists, no matter how short or minor it looks (a single word like "Numeric" is still its own topic).
- Do not merge two related-sounding topics into one, even if they seem like they belong together — if the syllabus lists them separately, keep them separate.
- Preserve the syllabus's own wording for each topic title as closely as possible — light cleanup (trimming numbering like "1.2", stray punctuation, extra whitespace) is fine, but do not paraphrase, rename, or reword.
- Preserve the order topics appear in within each unit, and preserve the order units appear in.
- Preserve every unit exactly as the syllabus divides it — do not merge two units into one or split one unit into two. Number units 1, 2, 3... in the order they appear (even if the source uses Roman numerals like "Unit I", "Unit II") and use the syllabus's own heading text (minus the "Unit N" label itself) as "title".
- If the syllabus text has no identifiable unit structure at all, put everything under a single unit (unit_no: 1) — but still extract every individual topic within it.
- "difficulty" must be exactly one of: "easy", "medium", "hard" — estimate based on typical coursework complexity for that specific topic; this is the one field where you may use judgment, since the syllabus doesn't state it.
- Output nothing outside the JSON object — not even a leading or trailing newline of prose.`;

export interface ExtractedTopic {
  title: string;
  subtopics?: string[];
  difficulty?: string;
}

export interface ExtractedUnit {
  unit_no: number;
  title: string;
  topics: ExtractedTopic[];
}

export interface ExtractedSyllabus {
  units: ExtractedUnit[];
}

export interface ExtractTopicsResult {
  data?: ExtractedSyllabus;
  error?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParse(raw: string): ExtractedSyllabus | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    if (!parsed || !Array.isArray(parsed.units)) return null;
    return parsed as ExtractedSyllabus;
  } catch {
    return null;
  }
}

export async function extractTopicsWithGroq(syllabusText: string): Promise<ExtractTopicsResult> {
  let groq: Groq;
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    return { error: describeGroqError(err, "extract-topics").error };
  }

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Syllabus text:\n\n${syllabusText}` },
  ];

  // Faithful, fully-flattened extraction produces a JSON object per
  // individual topic instead of a few topics with packed-in subtopic
  // strings — meaningfully more output tokens than before for the same
  // syllabus, so both budgets are sized up accordingly.
  const BASE_MAX_TOKENS = 12000;
  const RETRY_MAX_TOKENS = 24000;

  let raw: string;
  let truncatedByLength = false;
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_completion_tokens: BASE_MAX_TOKENS,
      // gpt-oss-120b is a reasoning model: without these, it can burn the
      // whole token budget on hidden chain-of-thought and return empty
      // content. "hidden" keeps reasoning out of the content field entirely.
      reasoning_effort: "low",
      reasoning_format: "hidden",
    });
    raw = completion.choices[0]?.message?.content ?? "";
    truncatedByLength = completion.choices[0]?.finish_reason === "length";
  } catch (err) {
    return { error: describeGroqError(err, "extract-topics").error };
  }

  let parsed = truncatedByLength ? null : tryParse(raw);

  if (!parsed) {
    // A large syllabus can produce more JSON than BASE_MAX_TOKENS allows —
    // retrying with the same budget would just get cut off again, so widen
    // it whenever the first attempt was a length cutoff rather than a
    // formatting mistake.
    try {
      const retryCompletion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        max_completion_tokens: truncatedByLength ? RETRY_MAX_TOKENS : BASE_MAX_TOKENS,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        messages: [
          ...messages,
          { role: "assistant", content: raw },
          {
            role: "user",
            content: truncatedByLength
              ? "Your previous response was cut off before it finished. Reply again with the complete JSON object from the start — no markdown, no explanation."
              : "Your previous response was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no markdown, no explanation.",
          },
        ],
      });
      const retryRaw = retryCompletion.choices[0]?.message?.content ?? "";
      parsed = tryParse(retryRaw);
    } catch (err) {
      return { error: describeGroqError(err, "extract-topics").error };
    }
  }

  if (!parsed || parsed.units.length === 0) {
    return {
      error:
        "We couldn't reliably structure this syllabus. Try Re-extract, or upload a clearer PDF.",
    };
  }

  return { data: parsed };
}
