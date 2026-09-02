import Link from "next/link";

import type { AttentionPriority, NeedsAttentionRow } from "@/lib/analytics/needs-attention";

const PRIORITY_STYLES: Record<AttentionPriority, string> = {
  high: "bg-accent-danger/10 text-accent-danger",
  medium: "bg-accent-warning/10 text-accent-warning",
  low: "bg-surface-raised text-text-secondary",
};

const PRIORITY_LABELS: Record<AttentionPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function NeedsAttentionTable({ rows }: { rows: NeedsAttentionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-text-secondary text-sm">Nothing needs attention — you&apos;re on track.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-border text-text-secondary border-b text-xs">
            <th className="py-2 pr-4 font-medium">Topic</th>
            <th className="py-2 pr-4 font-medium">Subject</th>
            <th className="py-2 pr-4 font-medium">Priority</th>
            <th className="py-2 pr-4 font-medium">Reason</th>
            <th className="py-2 pl-4 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <tr key={row.topicId}>
              <td className="text-text-primary py-2.5 pr-4 font-medium">{row.topicTitle}</td>
              <td className="text-text-secondary py-2.5 pr-4">{row.subjectName}</td>
              <td className="py-2.5 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[row.priority]}`}
                >
                  {PRIORITY_LABELS[row.priority]}
                </span>
              </td>
              <td className="text-text-secondary py-2.5 pr-4">{row.reason}</td>
              <td className="py-2.5 pl-4 text-right">
                {row.topicSlug ? (
                  <Link
                    href={`/dashboard/answer-book/${row.subjectSlug}/${row.topicSlug}`}
                    className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    Start Studying
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/subjects/${row.subjectSlug}`}
                    className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    Start Studying
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
