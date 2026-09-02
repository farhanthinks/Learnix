import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { Tile } from "@/components/dashboard/tile";
import type { TopicDifficulty, TopicStatus } from "@/types/database";

export interface TodayPlanItem {
  id: string;
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicTitle: string;
  difficulty: TopicDifficulty;
  status: TopicStatus;
  plannedMinutes: number;
}

const STATUS_DOT: Record<TopicStatus, string> = {
  pending: "bg-text-secondary",
  in_progress: "bg-accent-primary",
  done: "bg-accent-success",
};

export function TodayPlanTile({
  className = "",
  items,
}: {
  className?: string;
  items: TodayPlanItem[];
}) {
  return (
    <Tile className={className} padding="p-6">
      <h2 className="font-display text-text-primary text-base font-semibold">Today&apos;s Plan</h2>

      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
          <div className="bg-accent-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
            <CalendarDays className="text-accent-primary h-7 w-7" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">No tasks scheduled for today.</p>
            <p className="text-text-secondary text-xs">Take a break or plan your study!</p>
          </div>
          <Link
            href="/dashboard/subjects"
            className="bg-accent-primary focus-visible:outline-accent-primary rounded-lg px-4 py-2 text-sm font-medium text-white transition-[filter] duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Plan Your Day
          </Link>
        </div>
      ) : (
        <ul className="divide-border mt-4 flex flex-col divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/answer-book/${item.subjectSlug}/${item.topicSlug}`}
                className="focus-visible:outline-accent-primary flex items-center gap-3 rounded-lg px-1 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate text-sm font-medium">
                    {item.topicTitle}
                  </p>
                  <p className="text-text-secondary truncate text-xs">{item.subjectName}</p>
                </div>
                <span className="text-text-secondary shrink-0 font-mono text-xs">
                  {item.plannedMinutes}m
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}
