import { CalendarRange } from "lucide-react";

import { MiniLineChart } from "@/components/analytics/mini-line-chart";
import type { TrendPoint } from "@/lib/analytics/compute";

export function CompletionTrendCard({ trend }: { trend: TrendPoint[] }) {
  const data = trend.map((t) => ({ label: t.label, value: t.percent }));

  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-text-primary text-sm font-semibold">Completion Trend</h2>
        <span className="text-text-secondary flex items-center gap-1 text-xs font-medium">
          <CalendarRange className="h-3.5 w-3.5" strokeWidth={2} />
          Last 4 Weeks
        </span>
      </div>
      <MiniLineChart data={data} valueSuffix="%" height={160} color="#059669" />
    </div>
  );
}
