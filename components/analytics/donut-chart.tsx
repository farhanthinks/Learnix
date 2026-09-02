"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const EMPTY_TRACK_COLOR = "#E5E7EB";

export function DonutChart({
  segments,
  size = 140,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const data = total > 0 ? segments : [{ label: "None", value: 1, color: EMPTY_TRACK_COLOR }];

  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((seg, i) => (
              <Cell key={i} fill={seg.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerValue !== undefined || centerLabel !== undefined) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-text-primary font-mono text-xl font-bold">{centerValue}</span>
          )}
          {centerLabel !== undefined && (
            <span className="text-text-secondary text-[11px]">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
