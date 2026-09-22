export interface TopicForMatching {
  id: string;
  title: string;
}

const STOPWORDS = new Set([
  "what",
  "is",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "for",
  "to",
  "and",
  "or",
  "explain",
  "this",
  "that",
  "give",
  "me",
  "about",
  "how",
  "does",
  "do",
  "are",
  "with",
  "you",
  "your",
  "can",
  "please",
]);

function wordsOf(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length >= 3 && !STOPWORDS.has(w)) ?? []
  );
}

/**
 * Cheap keyword-overlap match between a question and the subject's topic
 * titles — used to decide which topics' saved notes (if any) are worth
 * pulling into the assistant's context, without embedding every topic's
 * full notes on every turn.
 */
export function matchTopics<T extends TopicForMatching>(
  question: string,
  topics: T[],
  limit = 2,
): T[] {
  const qWords = new Set(wordsOf(question));
  if (qWords.size === 0) return [];

  const scored = topics
    .map((topic) => {
      const titleWords = wordsOf(topic.title);
      const overlap = titleWords.filter((w) => qWords.has(w)).length;
      return { topic, score: overlap };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.topic);
}
