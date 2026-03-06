"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailySalePoint } from "@/lib/admin-stats-server";

interface SalesChartProps {
  data: DailySalePoint[];
}

function formatRevenue(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    revenueDisplay: d.revenue / 100,
    dateShort: d.date.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="dateShort"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => {
            const i = chartData.findIndex((d) => d.dateShort === v);
            if (i >= 0 && i % 5 === 0) return v;
            return "";
          }}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          yAxisId="count"
          orientation="right"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
                <div className="font-medium">{p.date}</div>
                <div>Revenue: {formatRevenue(p.revenue)}</div>
                <div>Sales: {p.count}</div>
              </div>
            );
          }}
        />
        <Legend />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenueDisplay"
          name="Revenue ($)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="count"
          name="Sales (count)"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
