import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DonutChart } from "@/components/analytics/donut-chart";
import { DonutLegend } from "@/components/analytics/donut-legend";
import type { SubjectBreakdown } from "@/lib/analytics/compute";

const SUBJECT_COLORS = ["#4F46E5", "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"];

export function CompletionBySubjectCard({
  subjects,
  overallPercent,
}: {
  subjects: SubjectBreakdown[];
  overallPercent: number;
}) {
  const legendItems = subjects.map((s, i) => ({
    label: s.subjectName,
    value: `${s.percentComplete}%`,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  // Each subject's slice is its share of *all* topics completed, so the
  // colored portion of the ring sums to overallPercent exactly — the
  // legend still shows each subject's own completion % alongside it.
  const totalTopics = subjects.reduce((sum, s) => sum + s.topicsTotal, 0);
  const subjectSegments = subjects.map((s, i) => ({
    label: s.subjectName,
    value: totalTopics === 0 ? 0 : (s.topicsDone / totalTopics) * 100,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));
  const remaining = Math.max(0, 100 - overallPercent);
  const segments =
    remaining > 0
      ? [...subjectSegments, { label: "Remaining", value: remaining, color: "#E5E7EB" }]
      : subjectSegments;

  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5">
      <h2 className="text-text-primary text-sm font-semibold">Completion by Subject</h2>

      {subjects.length === 0 ? (
        <p className="text-text-secondary text-sm">No subjects yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <DonutChart
            segments={segments}
            size={124}
            centerValue={`${overallPercent}%`}
            centerLabel="Overall"
          />
          <DonutLegend items={legendItems} />
        </div>
      )}

      <Link
        href="/dashboard/subjects"
        className="text-accent-primary mt-auto inline-flex w-auto items-center gap-0.5 text-xs font-medium hover:underline"
      >
        View all subjects <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
