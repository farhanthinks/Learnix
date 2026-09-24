import Groq from "groq-sdk";

export interface GroqErrorResponse {
  status: number;
  error: string;
}

// Ask AI's catch blocks used to swallow every failure into one generic
// message with no server-side trace, so a real outage and a spent daily
// quota looked identical and were impossible to tell apart from the logs.
// This logs the real cause and gives the student an accurate message for
// each case.
export function describeGroqError(err: unknown, context: string): GroqErrorResponse {
  if (err instanceof Groq.RateLimitError) {
    console.error(`[${context}] Groq rate limit hit:`, err.message);
    return {
      status: 429,
      error: "The AI has reached its usage limit for now. Please try again in a few minutes.",
    };
  }

  if (err instanceof Groq.APIError) {
    console.error(`[${context}] Groq API error (status ${err.status}):`, err.message);
  } else {
    console.error(`[${context}] Unexpected error calling Groq:`, err);
  }

  return {
    status: 502,
    error: "The AI service is temporarily unavailable. Please try again in a moment.",
  };
}
