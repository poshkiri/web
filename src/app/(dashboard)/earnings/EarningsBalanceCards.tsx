"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Clock, TrendingUp, Percent } from "lucide-react";

const MIN_PAYOUT = 50;

type StripeStatus = {
  isActive: boolean;
  balance: number;
  pendingBalance: number;
};

export function EarningsBalanceCards({
  totalEarned,
  totalPlatformFee,
}: {
  totalEarned: number;
  totalPlatformFee: number;
}) {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stripe/connect")
      .then((res) => res.json())
      .then((data: StripeStatus & { error?: string }) => {
        if (data.error) {
          setStatus({ isActive: false, balance: 0, pendingBalance: 0 });
        } else {
          setStatus({
            isActive: data.isActive ?? false,
            balance: data.balance ?? 0,
            pendingBalance: data.pendingBalance ?? 0,
          });
        }
      })
      .catch(() =>
        setStatus({ isActive: false, balance: 0, pendingBalance: 0 })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading || !status) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Available Balance",
      value: `$${status.balance.toFixed(2)}`,
      icon: Wallet,
      description: "Can be withdrawn",
    },
    {
      label: "Pending Balance",
      value: `$${status.pendingBalance.toFixed(2)}`,
      icon: Clock,
      description: "Not yet confirmed",
    },
    {
      label: "Total Earned",
      value: `$${totalEarned.toFixed(2)}`,
      icon: TrendingUp,
      description: "All time",
    },
    {
      label: "Platform Fee (20%)",
      value: `$${totalPlatformFee.toFixed(2)}`,
      icon: Percent,
      description: "Statistics",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, description }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { MIN_PAYOUT };
