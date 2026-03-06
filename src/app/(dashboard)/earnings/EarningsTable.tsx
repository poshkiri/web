"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TransactionRow = {
  id: string;
  assetTitle: string;
  buyerName: string | null;
  gross: number;
  platformFee: number;
  net: number;
  date: string;
  status: "pending" | "paid";
};

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
] as const;

function filterByPeriod(
  rows: TransactionRow[],
  period: string
): TransactionRow[] {
  if (period === "all") return rows;
  const days = parseInt(period, 10);
  if (Number.isNaN(days)) return rows;
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  const cutTime = cut.getTime();
  return rows.filter((r) => new Date(r.date).getTime() >= cutTime);
}

export function EarningsTable({ rows }: { rows: TransactionRow[] }) {
  const [period, setPeriod] = useState<string>("30");
  const filtered = useMemo(
    () => filterByPeriod(rows, period),
    [rows, period]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Transaction history</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Asset / Buyer</th>
                  <th className="pb-2 font-medium">Gross</th>
                  <th className="pb-2 font-medium">Platform fee</th>
                  <th className="pb-2 font-medium">Net</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-medium">{r.assetTitle}</div>
                      <div className="text-muted-foreground">
                        {r.buyerName ?? "—"}
                      </div>
                    </td>
                    <td className="py-2">${r.gross.toFixed(2)}</td>
                    <td className="py-2">${r.platformFee.toFixed(2)}</td>
                    <td className="py-2">${r.net.toFixed(2)}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant={
                          r.status === "paid" ? "default" : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
