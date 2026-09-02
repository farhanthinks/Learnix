import Link from "next/link";

import { formatDate } from "@/lib/format";
import { formatDurationSeconds } from "@/lib/quizzes/stats";

export interface PreviousAttemptData {
  attemptId: string;
  quizTitle: string;
  subjectName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number | null;
}

export function PreviousAttemptsTable({ attempts }: { attempts: PreviousAttemptData[] }) {
  if (attempts.length === 0) {
    return (
      <div className="border-border bg-surface rounded-2xl border p-8 text-center">
        <p className="text-text-secondary text-sm">
          No quizzes completed yet. Finish a quiz to see your attempt history here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-border text-text-secondary border-b text-xs">
            <th className="px-4 py-3 font-medium">Quiz</th>
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Correct</th>
            <th className="px-4 py-3 font-medium">Time Taken</th>
            <th className="py-3 pr-4 text-right font-medium">Review</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {attempts.map((a) => (
            <tr key={a.attemptId} className="text-sm">
              <td className="text-text-primary px-4 py-3 font-medium">{a.quizTitle}</td>
              <td className="text-text-secondary px-4 py-3">{a.subjectName}</td>
              <td className="text-text-secondary px-4 py-3">
                {formatDate(a.completedAt.slice(0, 10))}
              </td>
              <td className="text-text-primary px-4 py-3 font-mono">
                {a.score}/{a.totalQuestions}
              </td>
              <td className="text-text-secondary px-4 py-3">{a.score}</td>
              <td className="text-text-secondary px-4 py-3">
                {a.timeTakenSeconds !== null ? formatDurationSeconds(a.timeTakenSeconds) : "—"}
              </td>
              <td className="py-3 pr-4 text-right">
                <Link
                  href={`/dashboard/quizzes/results/${a.attemptId}`}
                  className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
