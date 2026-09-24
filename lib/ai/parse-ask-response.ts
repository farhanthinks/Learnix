const MAX_REFERENCES = 3;

export interface AskResponse {
  answer: string;
  references: string[];
}

interface RawAskResponse {
  answer?: string;
  references?: unknown;
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function tryParseAskResponse(raw: string | null | undefined): RawAskResponse | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as RawAskResponse;
  } catch {
    return null;
  }
}

export function sanitizeAskResponse(raw: RawAskResponse | null): AskResponse | null {
  if (!raw) return null;
  const answer = raw.answer?.trim();
  if (!answer) return null;

  const references = Array.isArray(raw.references)
    ? raw.references
        .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
        .map((r) => r.trim())
        .slice(0, MAX_REFERENCES)
    : [];

  return { answer, references };
}
