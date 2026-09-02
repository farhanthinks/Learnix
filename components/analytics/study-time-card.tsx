import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { MiniLineChart } from "@/components/analytics/mini-line-chart";
import type { WeeklyPoint } from "@/lib/analytics/compute";

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function StudyTimeCard({ weekly }: { weekly: WeeklyPoint[] }) {
  const data = weekly.map((w) => ({ label: dayLabel(w.date), value: w.minutes }));

  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Study Time (Last 7 Days)</h2>
      <MiniLineChart data={data} valueSuffix="m" height={160} />
      <Link
        href="/dashboard/study-plan"
        className="text-accent-primary inline-flex w-auto items-center gap-0.5 text-xs font-medium hover:underline"
      >
        View details <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
