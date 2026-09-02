"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

export interface MiniLinePoint {
  label: string;
  value: number;
}

export function MiniLineChart({
  data,
  valueSuffix = "",
  height = 160,
  color = "#4F46E5",
}: {
  data: MiniLinePoint[];
  valueSuffix?: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 22, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#F1F1F4" />
        <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis hide domain={[0, "dataMax"]} />
        <Tooltip
          cursor={{ stroke: "#E5E7EB" }}
          formatter={(value) => [`${typeof value === "number" ? value : 0}${valueSuffix}`, ""]}
          contentStyle={{
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: 12,
            color: "#111827",
            boxShadow: "0 4px 12px rgba(17,24,39,0.08)",
          }}
          labelStyle={{ color: "#6B7280" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) => (typeof v === "number" ? `${v}${valueSuffix}` : "")}
            fontSize={11}
            fill="#6B7280"
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
