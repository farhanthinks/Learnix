import { ChevronRight, Target } from "lucide-react";
import Link from "next/link";

export interface QuizSubjectData {
  slug: string;
  name: string;
  topicsTotal: number;
  quizzesGenerated: number;
}

export function QuizSubjectCard({ subject }: { subject: QuizSubjectData }) {
  return (
    <Link
      href={`/dashboard/quizzes/${subject.slug}`}
      className="border-border bg-surface hover:border-accent-primary/40 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
    >
      <span className="bg-accent-primary/10 text-accent-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        <Target className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-sm font-semibold">{subject.name}</p>
        <p className="text-text-secondary text-xs">
          {subject.topicsTotal} {subject.topicsTotal === 1 ? "topic" : "topics"} ·{" "}
          {subject.quizzesGenerated} quizzes generated
        </p>
      </div>
      <ChevronRight className="text-text-secondary h-4 w-4 shrink-0" strokeWidth={2} />
    </Link>
  );
}
