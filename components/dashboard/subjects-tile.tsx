import { BookOpen } from "lucide-react";
import Link from "next/link";

import { SubjectStatusPill } from "@/components/dashboard/status-pill";
import { Tile } from "@/components/dashboard/tile";
import { DeleteSubjectButton } from "@/components/subjects/delete-subject-button";
import { formatDate } from "@/lib/format";
import type { ExtractionStatus } from "@/types/database";

export interface DashboardSubject {
  id: string;
  slug: string;
  name: string;
  exam_date: string | null;
  extraction_status: ExtractionStatus;
  topicsDone: number;
  topicsTotal: number;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00Z`);
  const to = new Date(`${toStr}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function SubjectsTile({
  className = "",
  subjects,
}: {
  className?: string;
  subjects: DashboardSubject[];
}) {
  const todayStr = todayString();

  return (
    <Tile className={className} padding="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-text-primary text-base font-semibold">Your Subjects</h2>
        <Link
          href="/dashboard/subjects/new"
          className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 focus-visible:outline-accent-primary rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          + Add Subject
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-text-secondary text-sm">No subjects yet</p>
          <Link
            href="/dashboard/subjects/new"
            className="bg-accent-primary focus-visible:outline-accent-primary rounded-full px-4 py-2 text-sm font-medium text-white transition-[filter] duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Add your first subject
          </Link>
        </div>
      ) : (
        <ul className="divide-border mt-4 flex max-h-[420px] flex-col divide-y overflow-y-auto">
          {subjects.map((subject) => {
            const percent =
              subject.topicsTotal === 0
                ? 0
                : Math.round((subject.topicsDone / subject.topicsTotal) * 100);
            const daysUntilExam = subject.exam_date
              ? daysBetween(todayStr, subject.exam_date)
              : null;

            return (
              <li key={subject.id} className="relative">
                <Link
                  href={`/dashboard/subjects/${subject.slug}`}
                  className="focus-visible:outline-accent-primary flex items-center gap-3 rounded-lg px-1 py-3 pr-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="bg-accent-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <BookOpen className="text-accent-primary h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-text-primary truncate text-sm font-medium">
                        {subject.name}
                      </span>
                      <SubjectStatusPill
                        extractionStatus={subject.extraction_status}
                        topicsDone={subject.topicsDone}
                        topicsTotal={subject.topicsTotal}
                        daysUntilExam={daysUntilExam}
                      />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      {subject.exam_date ? (
                        <span className="text-text-secondary text-xs">
                          Exam: {formatDate(subject.exam_date)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {subject.topicsTotal > 0 && (
                        <span className="text-text-secondary font-mono text-xs">{percent}%</span>
                      )}
                    </div>
                    {subject.topicsTotal > 0 && (
                      <div className="bg-border mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${percent === 100 ? "bg-accent-success" : "bg-accent-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="absolute top-1/2 right-1 -translate-y-1/2">
                  <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Tile>
  );
}
