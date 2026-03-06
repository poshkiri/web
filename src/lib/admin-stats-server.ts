import { createClient } from "@/lib/supabase/server";

export interface AdminStats {
  totalRevenue: number;
  totalBuyers: number;
  totalSellers: number;
  assetsPendingReview: number;
  assetsPublished: number;
  salesToday: { count: number; revenue: number };
  salesThisWeek: { count: number; revenue: number };
  salesThisMonth: { count: number; revenue: number };
}

export interface DailySalePoint {
  date: string;
  revenue: number;
  count: number;
}

export interface RecentTransaction {
  id: string;
  amount: number;
  created_at: string;
  buyer: { id: string; name: string | null; email: string } | null;
  asset: { title: string; slug: string } | null;
}

export interface TopSeller {
  author_id: string;
  name: string | null;
  avatar_url: string | null;
  email: string;
  sales_count: number;
  revenue: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(new Date(now));
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = startOfDay(new Date(now));
  monthStart.setMonth(monthStart.getMonth() - 1);

  const [
    buyersRes,
    sellersRes,
    pendingRes,
    publishedRes,
    purchasesRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "buyer"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "seller"),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false)
      .is("rejection_reason", null),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", true),
    supabase.from("purchases").select("amount, created_at").range(0, 9999),
  ]);

  const allAmounts = (purchasesRes.data ?? []) as { amount: number; created_at: string }[];
  const totalRevenue = allAmounts.reduce((s, p) => s + p.amount, 0);

  let salesToday = { count: 0, revenue: 0 };
  let salesThisWeek = { count: 0, revenue: 0 };
  let salesThisMonth = { count: 0, revenue: 0 };
  const todayStartMs = todayStart.getTime();
  const weekStartMs = weekStart.getTime();
  const monthStartMs = monthStart.getTime();

  for (const p of allAmounts) {
    const t = new Date(p.created_at).getTime();
    if (t >= todayStartMs) {
      salesToday.count += 1;
      salesToday.revenue += p.amount;
    }
    if (t >= weekStartMs) {
      salesThisWeek.count += 1;
      salesThisWeek.revenue += p.amount;
    }
    if (t >= monthStartMs) {
      salesThisMonth.count += 1;
      salesThisMonth.revenue += p.amount;
    }
  }

  return {
    totalRevenue,
    totalBuyers: buyersRes.count ?? 0,
    totalSellers: sellersRes.count ?? 0,
    assetsPendingReview: pendingRes.count ?? 0,
    assetsPublished: publishedRes.count ?? 0,
    salesToday,
    salesThisWeek,
    salesThisMonth,
  };
}

export async function getSalesChartData(): Promise<DailySalePoint[]> {
  const supabase = await createClient();
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);

  const { data: rows } = await supabase
    .from("purchases")
    .select("amount, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const list = (rows ?? []) as { amount: number; created_at: string }[];
  const byDay: Record<string, { revenue: number; count: number }> = {};

  for (let d = 0; d < 31; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    byDay[toDateKey(date)] = { revenue: 0, count: 0 };
  }

  for (const p of list) {
    const key = toDateKey(new Date(p.created_at));
    if (byDay[key] != null) {
      byDay[key].revenue += p.amount;
      byDay[key].count += 1;
    }
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, count }]) => ({ date, revenue, count }));
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(
      "id, amount, created_at, buyer:users!user_id(id, name, email), asset:assets(title, slug)"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const rows = data ?? [];
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    amount: r.amount,
    created_at: r.created_at,
    buyer: r.buyer ?? null,
    asset: r.asset ?? null,
  })) as RecentTransaction[];
}

export async function getTopSellers(): Promise<TopSeller[]> {
  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("amount, asset:assets!asset_id(author_id)")
    .limit(5000);

  const list = (purchases ?? []) as { amount: number; asset: { author_id: string } | null }[];
  const byAuthor: Record<
    string,
    { revenue: number; count: number }
  > = {};

  for (const p of list) {
    const id = p.asset?.author_id;
    if (!id) continue;
    if (!byAuthor[id]) byAuthor[id] = { revenue: 0, count: 0 };
    byAuthor[id].revenue += p.amount;
    byAuthor[id].count += 1;
  }

  const topIds = Object.entries(byAuthor)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: users } = await supabase
    .from("users")
    .select("id, name, avatar_url, email")
    .in("id", topIds);

  const userMap = new Map(
    (users ?? []).map((u: { id: string; name: string | null; avatar_url: string | null; email: string }) => [u.id, u])
  );

  return topIds.map((author_id) => {
    const u = userMap.get(author_id);
    const agg = byAuthor[author_id];
    return {
      author_id,
      name: u?.name ?? null,
      avatar_url: u?.avatar_url ?? null,
      email: u?.email ?? "",
      sales_count: agg.count,
      revenue: agg.revenue,
    };
  });
}
