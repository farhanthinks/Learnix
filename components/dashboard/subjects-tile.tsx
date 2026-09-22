import { BookOpen } from "lucide-react";
import Link from "next/link";

import { SubjectStatusPill } from "@/components/dashboard/status-pill";
import { Tile } from "@/components/dashboard/tile";
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

const VISIBLE_LIMIT = 3;

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
  const visibleSubjects = subjects.slice(0, VISIBLE_LIMIT);
  const hasMore = subjects.length > VISIBLE_LIMIT;

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
        <>
          <ul className="divide-border mt-3 flex flex-col divide-y">
            {visibleSubjects.map((subject) => {
              const percent =
                subject.topicsTotal === 0
                  ? 0
                  : Math.round((subject.topicsDone / subject.topicsTotal) * 100);
              const daysUntilExam = subject.exam_date
                ? daysBetween(todayStr, subject.exam_date)
                : null;
              const subjectHref = `/dashboard/subjects/${subject.slug}`;

              return (
                <li key={subject.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-accent-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                      <BookOpen className="text-accent-primary h-4.5 w-4.5" strokeWidth={1.75} />
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
                      <div className="mt-2.5 flex items-center gap-2">
                        <Link
                          href={subjectHref}
                          className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                          View Syllabus
                        </Link>
                        <Link
                          href={`/dashboard/study-plan?subject=${subject.slug}`}
                          className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-[filter] hover:brightness-110"
                        >
                          Study Plan →
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="mt-2 text-right">
              <Link
                href="/dashboard/subjects"
                className="text-accent-primary text-xs font-medium hover:underline"
              >
                View all subjects →
              </Link>
            </div>
          )}
        </>
      )}
    </Tile>
  );
}
