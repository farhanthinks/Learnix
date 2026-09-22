import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface AnswerBookSubjectData {
  slug: string;
  name: string;
  topicsTotal: number;
  materialsGenerated: number;
}

export function SubjectCard({ subject }: { subject: AnswerBookSubjectData }) {
  return (
    <Link
      href={`/dashboard/answer-book/${subject.slug}`}
      className="border-border bg-surface hover:border-accent-primary/40 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
    >
      <span className="bg-accent-primary/10 text-accent-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        <BookOpen className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-sm font-semibold">{subject.name}</p>
        <p className="text-text-secondary text-xs">
          {subject.topicsTotal} {subject.topicsTotal === 1 ? "topic" : "topics"} ·{" "}
          {subject.materialsGenerated} generated materials
        </p>
      </div>
      <ChevronRight className="text-text-secondary h-4 w-4 shrink-0" strokeWidth={2} />
    </Link>
  );
}
