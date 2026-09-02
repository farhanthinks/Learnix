import { Target } from "lucide-react";
import Link from "next/link";

import { TopicQuizRow, type TopicQuizRowData } from "@/components/quizzes/topic-quiz-row";

const ROWS_SHOWN = 6;

export interface SubjectQuizLibraryData {
  slug: string;
  name: string;
  topicsTotal: number;
  quizzesGenerated: number;
  topicQuizzes: TopicQuizRowData[];
}

export function SubjectQuizCard({ subject }: { subject: SubjectQuizLibraryData }) {
  const visible = subject.topicQuizzes.slice(0, ROWS_SHOWN);
  const remaining = subject.topicQuizzes.length - visible.length;

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex items-center gap-3">
        <span className="bg-accent-primary/10 text-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Target className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <Link
            href={`/dashboard/subjects/${subject.slug}`}
            className="text-text-primary hover:text-accent-primary text-sm font-semibold"
          >
            {subject.name}
          </Link>
          <p className="text-text-secondary text-xs">
            {subject.topicsTotal} topics · {subject.quizzesGenerated} generated quizzes
          </p>
        </div>
      </div>

      <div className="border-border divide-border mt-4 flex flex-col divide-y border-t pt-2">
        {visible.map((t) => (
          <TopicQuizRow key={t.topicId} quiz={t} />
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-text-secondary mt-2 px-2.5 text-xs">+{remaining} more topics</p>
      )}
    </div>
  );
}
