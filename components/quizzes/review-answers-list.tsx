import type { QuizQuestionType } from "@/types/database";

export interface ReviewQuestion {
  id: string;
  question: string;
  questionType: QuizQuestionType;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  userAnswer: string;
  isCorrect: boolean;
}

export function ReviewAnswersList({ questions }: { questions: ReviewQuestion[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <li
          key={q.id}
          className={`rounded-xl border p-4 ${
            q.isCorrect
              ? "border-accent-success/30 bg-accent-success/5"
              : "border-accent-danger/30 bg-accent-danger/5"
          }`}
        >
          <p className="text-text-primary text-sm font-medium">
            {i + 1}. {q.question}
          </p>
          <p className="text-text-secondary mt-1.5 text-sm">
            Your answer:{" "}
            <span className="text-text-primary font-medium">{q.userAnswer || "(skipped)"}</span>
          </p>
          {!q.isCorrect && (
            <p className="text-text-secondary text-sm">
              Correct answer:{" "}
              <span className="text-text-primary font-medium">{q.correctAnswer}</span>
            </p>
          )}
          {q.explanation && <p className="text-text-secondary mt-1.5 text-xs">{q.explanation}</p>}
        </li>
      ))}
    </ul>
  );
}
