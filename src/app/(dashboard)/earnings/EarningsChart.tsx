"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type MonthData = { month: string; net: number };

export function EarningsChart({ data }: { data: MonthData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, "Net"]}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Bar dataKey="net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
