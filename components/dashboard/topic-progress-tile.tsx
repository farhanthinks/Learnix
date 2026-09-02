import type { CSSProperties } from "react";

import { Tile } from "@/components/dashboard/tile";

const SIZE = 110;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TopicProgressTile({
  className = "",
  completed,
  inProgress,
  pending,
}: {
  className?: string;
  completed: number;
  inProgress: number;
  pending: number;
}) {
  const total = completed + inProgress + pending;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const ringStyle = { "--ring-circumference": CIRCUMFERENCE } as CSSProperties;

  const rows = [
    { label: "Completed", count: completed, dot: "bg-accent-success" },
    { label: "In Progress", count: inProgress, dot: "bg-accent-primary" },
    { label: "Pending", count: pending, dot: "bg-border" },
  ];

  return (
    <Tile className={className} padding="p-6">
      <h2 className="font-display text-text-primary text-base font-semibold">Topic Progress</h2>
      <div className="mt-4 flex items-center gap-6">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-accent-success)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className="ring-animated"
            style={ringStyle}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-text-primary font-mono text-xl font-bold"
          >
            {percent}%
          </text>
        </svg>
        <div className="flex flex-1 flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-secondary flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                {row.label}
              </span>
              <span className="text-text-primary font-mono font-medium">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-text-secondary mt-3 text-xs">
        <span className="text-text-primary font-mono">{completed}</span> of{" "}
        <span className="text-text-primary font-mono">{total}</span> topics completed
      </p>
    </Tile>
  );
}
