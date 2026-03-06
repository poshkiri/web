import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EarningsBalanceCards } from "./EarningsBalanceCards";
import { StripeConnectBanner } from "./StripeConnectBanner";
import { PayoutButtonWithModal } from "./PayoutButtonWithModal";
import { EarningsChart } from "./EarningsChart";
import { EarningsTable, type TransactionRow } from "./EarningsTable";

export const dynamic = "force-dynamic";

type EarningRow = {
  id: string;
  asset_id: string;
  amount: number;
  platform_fee: number;
  status: "pending" | "paid";
  created_at: string;
  asset: { title: string } | null;
};

type PurchaseRow = {
  id: string;
  asset_id: string;
  amount: number;
  created_at: string;
  user: { name: string | null; email: string } | null;
};

function last6Months(): { year: number; month: number; label: string }[] {
  const out: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return out;
}

async function getEarningsData(sellerId: string) {
  const supabase = await createClient();

  const { data: earningsRows } = await supabase
    .from("earnings")
    .select("id, asset_id, amount, platform_fee, status, created_at, asset:assets(title)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  const earnings = (earningsRows ?? []) as EarningRow[];

  const assetIds = [...new Set(earnings.map((e) => e.asset_id))];
  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("id, asset_id, amount, created_at, user:users(name, email)")
    .in("asset_id", assetIds)
    .order("created_at", { ascending: false });

  const purchases = (purchaseRows ?? []) as PurchaseRow[];

  const gross = (e: EarningRow) => e.amount + e.platform_fee;
  const round = (x: number) => Math.round(x * 100) / 100;

  const usedPurchaseIds = new Set<string>();
  const buyerByEarning = new Map<string, string>();

  for (const e of earnings) {
    const g = round(gross(e));
    const candidates = purchases
      .filter(
        (p) =>
          p.asset_id === e.asset_id &&
          round(p.amount) === g &&
          new Date(p.created_at).getTime() <= new Date(e.created_at).getTime() &&
          !usedPurchaseIds.has(p.id)
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    const match = candidates[0];
    if (match) {
      usedPurchaseIds.add(match.id);
      buyerByEarning.set(
        e.id,
        match.user?.name?.trim() || match.user?.email || "—"
      );
    }
  }

  const totalEarned = earnings.reduce((s, e) => s + e.amount, 0);
  const totalPlatformFee = earnings.reduce((s, e) => s + e.platform_fee, 0);

  const months = last6Months();
  const byMonth = months.map(({ year, month, label }) => {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();
    const net = earnings
      .filter(
        (e) =>
          new Date(e.created_at).getTime() >= start &&
          new Date(e.created_at).getTime() <= end
      )
      .reduce((s, e) => s + e.amount, 0);
    return { month: label, net: Math.round(net * 100) / 100 };
  });

  const tableRows: TransactionRow[] = earnings.map((e) => ({
    id: e.id,
    assetTitle: e.asset?.title ?? "—",
    buyerName: buyerByEarning.get(e.id) ?? null,
    gross: round(gross(e)),
    platformFee: e.platform_fee,
    net: e.amount,
    date: e.created_at,
    status: e.status,
  }));

  return {
    totalEarned,
    totalPlatformFee,
    chartData: byMonth,
    tableRows,
  };
}

export default async function EarningsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "seller" && user.role !== "admin") {
    redirect("/dashboard");
  }

  const { totalEarned, totalPlatformFee, chartData, tableRows } =
    await getEarningsData(user.id);

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Balance, payouts, and transaction history
        </p>
      </div>

      {!user.stripe_account_id && <StripeConnectBanner />}

      <EarningsBalanceCards
        totalEarned={totalEarned}
        totalPlatformFee={totalPlatformFee}
      />

      <div className="flex flex-wrap gap-4">
        <PayoutButtonWithModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings by month</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last 6 months (net amount)
          </p>
        </CardHeader>
        <CardContent>
          <EarningsChart data={chartData} />
        </CardContent>
      </Card>

      <EarningsTable rows={tableRows} />
    </div>
  );
}
