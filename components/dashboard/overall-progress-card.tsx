import type { CSSProperties } from "react";

import { Tile } from "@/components/dashboard/tile";

const SIZE = 90;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OverallProgressCard({
  done,
  total,
  className = "",
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const ringStyle = { "--ring-circumference": CIRCUMFERENCE } as CSSProperties;

  return (
    <Tile className={`flex flex-col items-center gap-3 text-center ${className}`} padding="p-6">
      <h3 className="text-text-secondary text-sm font-medium">Overall Progress</h3>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
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
          stroke="var(--color-accent-primary)"
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
          className="fill-text-primary font-mono text-lg font-bold"
        >
          {percent}%
        </text>
      </svg>
      <p className="text-text-secondary text-xs">
        <span className="text-text-primary font-mono">{done}</span> /{" "}
        <span className="text-text-primary font-mono">{total}</span> topics completed
      </p>
    </Tile>
  );
}
