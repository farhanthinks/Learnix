/** 30 questions / 45 minutes is the reference ratio from the product spec. */
const MOCK_MINUTES_PER_QUESTION = 1.5;
const MOCK_MIN_QUESTIONS = 15;
const MOCK_MAX_QUESTIONS = 30;
const MOCK_MIN_TIME_LIMIT = 15;

export function computeMockQuestionCount(topicsCount: number): number {
  return Math.min(MOCK_MAX_QUESTIONS, Math.max(MOCK_MIN_QUESTIONS, topicsCount));
}

export function computeMockTimeLimitMinutes(questionCount: number): number {
  return Math.max(MOCK_MIN_TIME_LIMIT, Math.round(questionCount * MOCK_MINUTES_PER_QUESTION));
}

export function computePercentage(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

export function formatDurationSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
