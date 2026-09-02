import Link from "next/link";

export interface ContinuePracticeItem {
  attemptId: string;
  quizTitle: string;
  subjectName: string;
  questionCount: number;
  progressPercent: number;
  isCompleted: boolean;
  score: number | null;
}

export function ContinuePracticeRow({ item }: { item: ContinuePracticeItem }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
      <div>
        <p className="text-text-primary text-sm font-semibold">{item.quizTitle}</p>
        <p className="text-text-secondary text-xs">
          {item.subjectName} · {item.questionCount} Questions
        </p>
      </div>

      <div className="bg-surface-raised h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent-primary h-full rounded-full transition-[width]"
          style={{ width: `${item.progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs">
          {item.isCompleted && item.score !== null
            ? `Score: ${item.score}/${item.questionCount}`
            : `${item.progressPercent}% complete`}
        </span>
        <Link
          href={
            item.isCompleted
              ? `/dashboard/quizzes/results/${item.attemptId}`
              : `/dashboard/quizzes/take/${item.attemptId}`
          }
          className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 inline-flex w-auto items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {item.isCompleted ? "Review" : "Continue"}
        </Link>
      </div>
    </div>
  );
}
