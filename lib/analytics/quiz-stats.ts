export interface QuizAccuracyInput {
  score: number;
  total_questions: number;
}

export interface QuizAccuracyResult {
  accuracyPercent: number;
  totalAttempts: number;
}

/** Weighted across all completed attempts (correct answers / questions answered), not an average of per-attempt percentages, so a single long quiz doesn't get drowned out by many short ones. */
export function computeQuizAccuracy(attempts: QuizAccuracyInput[]): QuizAccuracyResult {
  if (attempts.length === 0) return { accuracyPercent: 0, totalAttempts: 0 };
  const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
  return {
    accuracyPercent: totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100),
    totalAttempts: attempts.length,
  };
}

export interface QuestionPerformanceAttempt {
  quiz_id: string;
  answers: Record<string, string>;
}

export interface QuizQuestionAnswerKey {
  id: string;
  correct_answer: string;
}

export interface QuestionPerformanceResult {
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Tallies every question across every completed attempt (a retaken quiz counts each attempt's questions separately) into correct / incorrect / left-blank. */
export function computeQuestionPerformance(
  attempts: QuestionPerformanceAttempt[],
  questionsByQuizId: Map<string, QuizQuestionAnswerKey[]>,
): QuestionPerformanceResult {
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  for (const attempt of attempts) {
    const questions = questionsByQuizId.get(attempt.quiz_id) ?? [];
    for (const q of questions) {
      const userAnswer = attempt.answers[q.id] ?? "";
      if (userAnswer.trim().length === 0) {
        unattempted++;
      } else if (normalize(userAnswer) === normalize(q.correct_answer)) {
        correct++;
      } else {
        incorrect++;
      }
    }
  }

  return { correct, incorrect, unattempted, total: correct + incorrect + unattempted };
}
