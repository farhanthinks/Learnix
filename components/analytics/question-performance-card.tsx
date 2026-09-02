import { DonutChart } from "@/components/analytics/donut-chart";
import { DonutLegend } from "@/components/analytics/donut-legend";
import type { QuestionPerformanceResult } from "@/lib/analytics/quiz-stats";

const COLORS = { correct: "#059669", incorrect: "#DC2626", unattempted: "#E5E7EB" };

function pct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function QuestionPerformanceCard({ result }: { result: QuestionPerformanceResult }) {
  const segments = [
    { label: "Correct", value: result.correct, color: COLORS.correct },
    { label: "Incorrect", value: result.incorrect, color: COLORS.incorrect },
    { label: "Unattempted", value: result.unattempted, color: COLORS.unattempted },
  ];
  const legendItems = segments.map((s) => ({
    ...s,
    value: `${pct(s.value, result.total)}%`,
  }));

  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Question Performance</h2>
      <div className="flex items-center gap-4">
        <DonutChart
          segments={segments}
          size={116}
          centerValue={String(result.total)}
          centerLabel="Total"
        />
        <DonutLegend items={legendItems} />
      </div>
    </div>
  );
}
