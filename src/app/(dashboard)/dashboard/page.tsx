import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Purchase } from "@/types";
import {
  ShoppingBag,
  Store,
  Upload,
  LayoutDashboard,
  Star,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  FileCheck,
} from "lucide-react";

// --- Skeletons ---

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

// --- Buyer: last 3 purchases ---

type PurchaseWithAsset = Purchase & {
  asset?: { title: string; slug: string; price: number } | null;
};

async function BuyerRecentPurchases({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, asset_id, amount, created_at, asset:assets(title, slug, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const purchases = (data ?? []) as PurchaseWithAsset[];

  if (purchases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t made any purchases yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {purchases.map((p) => (
        <li key={p.id}>
          <Link
            href={`/assets/${p.asset?.slug ?? p.asset_id}`}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <span className="font-medium">{p.asset?.title ?? "Asset"}</span>
            <span className="text-muted-foreground">
              ${(p.amount / 100).toFixed(2)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// --- Seller: stats + last 5 sales ---

type SellerSaleRow = {
  id: string;
  amount: number;
  created_at: string;
  asset: { title: string; slug: string } | null;
};

async function SellerStats({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [assetsRes, purchasesRes] = await Promise.all([
    supabase
      .from("assets")
      .select("id, rating_avg")
      .eq("author_id", userId),
    supabase
      .from("purchases")
      .select("id, amount, created_at, asset:assets!inner(title, slug, author_id)")
      .eq("assets.author_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const assets = assetsRes.data ?? [];
  const purchases = (purchasesRes.data ?? []) as SellerSaleRow[];

  const totalSales = purchases.length;
  const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);
  const assetsPublished = assets.length;
  const ratings = assets.map((a) => a.rating_avg).filter((r): r is number => r != null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  const stats = [
    { label: "Total Sales", value: totalSales, icon: TrendingUp },
    {
      label: "Total Earnings",
      value: `$${(totalEarnings / 100).toFixed(2)}`,
      icon: DollarSign,
    },
    { label: "Assets Published", value: assetsPublished, icon: Package },
    {
      label: "Average Rating",
      value: avgRating != null ? avgRating.toFixed(1) : "—",
      icon: Star,
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>Last 5 sales of your assets</CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 5).map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        <Link
                          href={`/assets/${p.asset?.slug ?? ""}`}
                          className="hover:underline"
                        >
                          {p.asset?.title ?? "—"}
                        </Link>
                      </td>
                      <td className="py-2">
                        ${(p.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// --- Admin: stats ---

async function AdminStats() {
  const supabase = await createClient();

  const [pendingRes, usersRes, revenueRes] = await Promise.all([
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("purchases").select("amount"),
  ]);

  const pendingCount = pendingRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;
  const totalRevenue =
    (revenueRes.data ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) ?? 0;

  const stats = [
    { label: "Assets Pending Review", value: pendingCount, icon: FileCheck },
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Total Revenue", value: `$${(totalRevenue / 100).toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// --- Role-based content ---

async function DashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">You are not signed in.</p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (user.role === "buyer") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your recent purchases and quick actions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent purchases</CardTitle>
            <CardDescription>Last 3 purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <BuyerRecentPurchases userId={user.id} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/assets">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Assets
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/onboarding">
              <Store className="mr-2 h-4 w-4" />
              Become a Seller
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.role === "seller") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Your stats and recent sales
          </p>
        </div>

        <SellerStats userId={user.id} />

        <div>
          <Button asChild size="lg">
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Asset
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and moderation
          </p>
        </div>

        <AdminStats />

        <div>
          <Button asChild size="lg">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Admin Panel
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// --- Page ---

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
