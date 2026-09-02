import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/lib/format";

export interface DeadlineSubject {
  slug: string;
  name: string;
  examDate: string;
  daysLeft: number;
}

function urgencyClass(daysLeft: number): string {
  if (daysLeft <= 3) return "text-accent-danger";
  if (daysLeft <= 10) return "text-accent-warning";
  return "text-text-secondary";
}

export function UpcomingDeadlinesCard({ deadlines }: { deadlines: DeadlineSubject[] }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Upcoming Deadlines</h2>
      {deadlines.length === 0 ? (
        <p className="text-text-secondary text-xs">No upcoming exam dates.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {deadlines.map((d) => (
            <li key={d.slug}>
              <Link href={`/dashboard/subjects/${d.slug}`} className="group flex items-start gap-3">
                <span className="bg-accent-primary/10 text-accent-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <CalendarClock className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary group-hover:text-accent-primary truncate text-sm font-medium">
                    {d.name} Exam
                  </p>
                  <p className="text-text-secondary text-xs">{formatDate(d.examDate)}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium ${urgencyClass(d.daysLeft)}`}>
                  {d.daysLeft} {d.daysLeft === 1 ? "day" : "days"} left
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
