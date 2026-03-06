import Link from "next/link";
import Image from "next/image";
import {
  getAdminStats,
  getSalesChartData,
  getRecentTransactions,
  getTopSellers,
} from "@/lib/admin-stats-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesChart } from "@/components/admin/SalesChart";
import {
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  FileCheck,
  TrendingUp,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  const [stats, chartData, recentTx, topSellers] = await Promise.all([
    getAdminStats(),
    getSalesChartData(),
    getRecentTransactions(),
    getTopSellers(),
  ]);

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Link href="/admin/assets?status=pending">
          <Button variant="outline" className="relative">
            Review Pending Assets
            {stats.assetsPendingReview > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 size-5 rounded-full p-0 text-xs"
              >
                {stats.assetsPendingReview}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatMoney(stats.totalRevenue)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buyers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalBuyers}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellers</CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalSellers}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.assetsPendingReview}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.assetsPublished}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales (T/W/M)</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Today: {stats.salesToday.count} — {formatMoney(stats.salesToday.revenue)}</div>
              <div>Week: {stats.salesThisWeek.count} — {formatMoney(stats.salesThisWeek.revenue)}</div>
              <div>Month: {stats.salesThisMonth.count} — {formatMoney(stats.salesThisMonth.revenue)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Sales (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/admin/assets" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 font-medium">Buyer</th>
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    recentTx.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2">
                          {tx.buyer?.name ?? tx.buyer?.email ?? "—"}
                        </td>
                        <td className="py-2">
                          {tx.asset?.slug ? (
                            <Link
                              href={`/assets/${tx.asset.slug}`}
                              className="text-primary hover:underline"
                            >
                              {tx.asset.title}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2">{formatMoney(tx.amount)}</td>
                        <td className="py-2 text-muted-foreground">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 font-medium">Seller</th>
                    <th className="pb-2 font-medium">Sales</th>
                    <th className="pb-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-muted-foreground">
                        No sales yet
                      </td>
                    </tr>
                  ) : (
                    topSellers.map((s) => (
                      <tr key={s.author_id} className="border-b last:border-0">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {s.avatar_url ? (
                              <Image
                                src={s.avatar_url}
                                alt=""
                                width={28}
                                height={28}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {(s.name ?? s.email).slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span>{s.name ?? s.email}</span>
                          </div>
                        </td>
                        <td className="py-2">{s.sales_count}</td>
                        <td className="py-2">{formatMoney(s.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
