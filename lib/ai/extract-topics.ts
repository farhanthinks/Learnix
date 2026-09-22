import Groq from "groq-sdk";

// Groq deprecated the Llama 3.1/3.3 models; gpt-oss-120b is the current
// best-available option in this catalog for structured extraction.
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are an expert academic assistant that converts raw syllabus text into a structured study plan.

Return STRICT JSON ONLY. No markdown, no code fences, no commentary before or after the JSON.

Match this exact shape:
{
  "units": [
    {
      "unit_no": 1,
      "title": "Unit title",
      "topics": [
        { "title": "Topic title", "subtopics": ["sub1", "sub2"], "difficulty": "easy" }
      ]
    }
  ]
}

Rules:
- "difficulty" must be exactly one of: "easy", "medium", "hard".
- Infer sensible unit numbers and titles even if the syllabus text doesn't label them explicitly.
- Keep topic titles concise; put finer-grained detail in "subtopics".
- Estimate difficulty based on typical coursework complexity for that subject.
- If the text has no identifiable unit structure, put everything under a single unit (unit_no: 1).
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

const UNAVAILABLE_ERROR =
  "The AI service is temporarily unavailable. Please try Re-extract in a moment.";

export async function extractTopicsWithGroq(syllabusText: string): Promise<ExtractTopicsResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Syllabus text:\n\n${syllabusText}` },
  ];

  const BASE_MAX_TOKENS = 8192;
  const RETRY_MAX_TOKENS = 16384;

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
  } catch {
    return { error: UNAVAILABLE_ERROR };
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
    } catch {
      return { error: UNAVAILABLE_ERROR };
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
