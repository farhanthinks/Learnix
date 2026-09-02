import { DonutChart } from "@/components/analytics/donut-chart";
import { DonutLegend } from "@/components/analytics/donut-legend";
import type { TopicMastery } from "@/lib/analytics/compute";

const COLORS = {
  mastered: "#059669",
  inProgress: "#2563EB",
  needsAttention: "#D97706",
  notStarted: "#E5E7EB",
};

export function TopicMasteryCard({ mastery }: { mastery: TopicMastery }) {
  const buckets = [
    { ...mastery.mastered, key: "mastered" as const, rangeLabel: "80–100%" },
    { ...mastery.inProgress, key: "inProgress" as const, rangeLabel: "30–79%" },
    { ...mastery.needsAttention, key: "needsAttention" as const, rangeLabel: "0–29%" },
    { ...mastery.notStarted, key: "notStarted" as const, rangeLabel: null },
  ];

  const segments = buckets.map((b) => ({ label: b.label, value: b.count, color: COLORS[b.key] }));
  const legendItems = buckets.map((b) => ({
    label: b.rangeLabel ? `${b.label} (${b.rangeLabel})` : b.label,
    value: `${b.count} · ${b.percent}%`,
    color: COLORS[b.key],
  }));

  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Topic Mastery</h2>
      <div className="flex items-center gap-4">
        <DonutChart segments={segments} size={116} />
        <DonutLegend items={legendItems} />
      </div>
    </div>
  );
}
