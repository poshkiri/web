import { createClient } from "@/lib/supabase/server";
import type { AssetWithCategory } from "@/lib/assets-server";
import type { Category } from "@/types";

const ASSET_SELECT =
  "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)";

function mapAssets(rows: Record<string, unknown>[] | null): AssetWithCategory[] {
  return (rows ?? []).map((row: Record<string, unknown>) => {
    const { author, category, ...asset } = row;
    return {
      ...asset,
      author: author ?? null,
      category: category ?? null,
    } as AssetWithCategory;
  });
}

export interface CategoryWithCount extends Category {
  asset_count: number;
}

/** Categories with approved asset count for homepage. */
export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  if (catError || !categories?.length) return [];

  const withCount: CategoryWithCount[] = [];
  for (const cat of categories) {
    const { count, error: countError } = await supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id)
      .eq("is_approved", true);
    withCount.push({
      ...cat,
      asset_count: countError ? 0 : count ?? 0,
    });
  }
  return withCount;
}

/** Featured assets (is_featured = true), up to 4. Fallback: top by rating if column missing or empty. */
export async function getFeaturedAssets(): Promise<AssetWithCategory[]> {
  const supabase = await createClient();
  try {
    const { data: rows, error } = await supabase
      .from("assets")
      .select(ASSET_SELECT)
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(4);
    if (!error && rows?.length) return mapAssets(rows);
  } catch {
    // Column is_featured may not exist
  }
  const { data: fallback } = await supabase
    .from("assets")
    .select(ASSET_SELECT)
    .eq("is_approved", true)
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .limit(4);
  return mapAssets(fallback ?? []);
}

/** Newest approved assets, 8 items. */
export async function getNewArrivals(): Promise<AssetWithCategory[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("assets")
    .select(ASSET_SELECT)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return [];
  return mapAssets(rows ?? []);
}

export interface TopSeller {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string;
  asset_count: number;
  rating_avg: number;
}

/** Top 3 sellers by asset count, then by average rating. */
export async function getTopSellers(): Promise<TopSeller[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("assets")
    .select("author_id, rating_avg")
    .eq("is_approved", true);

  if (error || !rows?.length) return [];

  const byAuthor = new Map<
    string,
    { count: number; sumRating: number; ratingCount: number }
  >();
  for (const r of rows) {
    const id = r.author_id as string;
    const rating = (r.rating_avg as number) ?? 0;
    const cur = byAuthor.get(id) ?? {
      count: 0,
      sumRating: 0,
      ratingCount: 0,
    };
    cur.count += 1;
    if (rating > 0) {
      cur.sumRating += rating;
      cur.ratingCount += 1;
    }
    byAuthor.set(id, cur);
  }

  const sorted = [...byAuthor.entries()]
    .map(([authorId, agg]) => ({
      authorId,
      asset_count: agg.count,
      rating_avg:
        agg.ratingCount > 0 ? agg.sumRating / agg.ratingCount : 0,
    }))
    .sort((a, b) => b.asset_count - a.asset_count || b.rating_avg - a.rating_avg)
    .slice(0, 3);

  const authorIds = sorted.map((s) => s.authorId);
  const { data: users } = await supabase
    .from("users")
    .select("id, email, name, avatar_url")
    .in("id", authorIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, u])
  );
  return sorted.map((s) => {
    const u = userMap.get(s.authorId);
    return {
      id: u?.id ?? s.authorId,
      name: u?.name ?? null,
      avatar_url: u?.avatar_url ?? null,
      email: u?.email ?? "",
      asset_count: s.asset_count,
      rating_avg: Math.round(s.rating_avg * 10) / 10,
    } as TopSeller;
  });
}
