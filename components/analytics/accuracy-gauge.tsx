"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const FILL_COLOR = "#4F46E5";
const TRACK_COLOR = "#E5E7EB";

export function AccuracyGauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const data = [
    { value: clamped, color: FILL_COLOR },
    { value: 100 - clamped, color: TRACK_COLOR },
  ];

  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 108 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="100%"
              innerRadius={64}
              outerRadius={88}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-text-primary font-mono text-2xl font-bold">{clamped}%</span>
        </div>
      </div>
      <div className="text-text-secondary -mt-1 flex w-[200px] justify-between text-[11px]">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
