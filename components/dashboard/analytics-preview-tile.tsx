"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Tile } from "@/components/dashboard/tile";

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function formatMinutesTick(value: number): string {
  if (value === 0) return "0m";
  if (value < 60) return `${value}m`;
  const hours = value / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function AnalyticsPreviewTile({
  className = "",
  weekly,
}: {
  className?: string;
  weekly: { date: string; minutes: number }[];
}) {
  const chartData = weekly.map((d) => ({ ...d, label: dayLabel(d.date) }));
  const maxMinutes = Math.max(60, ...weekly.map((d) => d.minutes));

  return (
    <Tile className={className} padding="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-text-primary text-base font-semibold">
          Study Time – Last 7 Days
        </h2>
        <Link
          href="/dashboard/analytics"
          className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 focus-visible:outline-accent-primary rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          View Analytics
        </Link>
      </div>
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, maxMinutes]}
              tickFormatter={formatMinutesTick}
              width={36}
            />
            <Tooltip
              formatter={(value: unknown) => [
                `${typeof value === "number" ? value : 0} min`,
                "Studied",
              ]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 12,
                color: "#111827",
                boxShadow: "0 4px 12px rgba(17,24,39,0.08)",
              }}
              labelStyle={{ color: "#6B7280" }}
            />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tile>
  );
}
