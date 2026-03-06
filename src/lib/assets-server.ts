import { createClient } from "@/lib/supabase/server";
import type { AssetWithAuthor, Engine, Purchase } from "@/types";

export type AssetWithCategory = AssetWithAuthor & {
  category?: { id: string; name: string; slug: string } | null;
};

export type AssetDetail = AssetWithCategory & {
  reviewsCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user: { id: string; name: string | null; avatar_url: string | null; email: string };
  }>;
};

const PAGE_SIZE = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 500;

const SORT_MAP: Record<
  string,
  { column: string; ascending: boolean; nullsFirst?: boolean }
> = {
  newest: { column: "created_at", ascending: false },
  popular: { column: "downloads_count", ascending: false },
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  top_rated: {
    column: "rating_avg",
    ascending: false,
    nullsFirst: false,
  },
};

export interface AssetsPageResult {
  assets: AssetWithCategory[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface AssetsSearchParams {
  page?: string | string[];
  category?: string | string[];
  engine?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
  search?: string | string[];
}

function parseNumber(value: string | string[] | undefined, fallback: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(PRICE_MAX, Math.max(PRICE_MIN, n)) : fallback;
}

function parsePage(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  if (v == null || v === "") return 1;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export async function getAssetsPage(
  searchParams: AssetsSearchParams
): Promise<AssetsPageResult> {
  const supabase = await createClient();
  const page = parsePage(searchParams.page);
  const categorySlugs = toArray(searchParams.category);
  const engines = toArray(searchParams.engine) as Engine[];
  const minPrice = parseNumber(searchParams.minPrice, PRICE_MIN);
  const maxPrice = parseNumber(searchParams.maxPrice, PRICE_MAX);
  const sortKey = (Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) ?? "newest";
  const sortConfig = SORT_MAP[sortKey] ?? SORT_MAP.newest;
  const search = (Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search)?.trim() ?? "";

  let categoryIds: string[] = [];
  if (categorySlugs.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .in("slug", categorySlugs);
    categoryIds = (categories ?? []).map((c) => c.id);
    if (categoryIds.length === 0) {
      return { assets: [], totalCount: 0, page: 1, totalPages: 0 };
    }
  }

  let query = supabase
    .from("assets")
    .select(
      "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)",
      { count: "exact" }
    )
    .eq("is_approved", true);

  if (categoryIds.length > 0) {
    query = query.in("category_id", categoryIds);
  }
  if (engines.length > 0) {
    query = query.in("engine", engines);
  }
  query = query.gte("price", minPrice).lte("price", maxPrice);

  if (search) {
    const term = search.replace(/'/g, "''");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  query = query.order(sortConfig.column, {
    ascending: sortConfig.ascending,
    nullsFirst: sortConfig.nullsFirst,
  });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: rows, error, count } = await query.range(from, to);

  if (error) {
    console.error("getAssetsPage error:", error);
    return { assets: [], totalCount: 0, page: 1, totalPages: 0 };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const assets = (rows ?? []).map((row: Record<string, unknown>) => {
    const { author, category, ...asset } = row;
    return {
      ...asset,
      author: author ?? null,
      category: category ?? null,
    } as AssetWithCategory;
  });

  return {
    assets,
    totalCount,
    page,
    totalPages,
  };
}

/** Single asset by slug for detail page. Returns null if not found or not approved. */
export async function getAssetBySlug(slug: string): Promise<AssetDetail | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("assets")
    .select(
      "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)"
    )
    .eq("slug", slug)
    .eq("is_approved", true)
    .single();

  if (error || !row) return null;

  const { author, category, ...asset } = row as Record<string, unknown>;
  const assetWithRel = {
    ...asset,
    author: author ?? null,
    category: category ?? null,
  } as AssetWithCategory;

  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", assetWithRel.id);

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, user:users(id, name, avatar_url, email)")
    .eq("asset_id", assetWithRel.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews = (reviewRows ?? []).map((r: Record<string, unknown>) => {
    const { user, ...rest } = r;
    return { ...rest, user: user ?? {} };
  }) as AssetDetail["reviews"];

  return {
    ...assetWithRel,
    reviewsCount: reviewsCount ?? 0,
    reviews,
  };
}

/** Check if the user has purchased this asset. */
export async function userHasPurchased(
  userId: string | null,
  assetId: string
): Promise<boolean> {
  if (!userId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("asset_id", assetId)
    .limit(1)
    .maybeSingle();
  return !error && data != null;
}

/** More assets from the same seller (author). Excludes current asset. */
export async function getMoreFromSeller(
  authorId: string,
  excludeAssetId: string,
  limit: number = 4
): Promise<AssetWithCategory[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("assets")
    .select(
      "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)"
    )
    .eq("author_id", authorId)
    .eq("is_approved", true)
    .neq("id", excludeAssetId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (rows ?? []).map((row: Record<string, unknown>) => {
    const { author, category, ...asset } = row;
    return {
      ...asset,
      author: author ?? null,
      category: category ?? null,
    } as AssetWithCategory;
  });
}

/** All approved asset slugs for sitemap. */
export async function getAllAssetSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("slug")
    .eq("is_approved", true);
  if (error) return [];
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

/** Similar assets: same category, then by rating/downloads. Excludes current asset. */
export async function getSimilarAssets(
  categoryId: string,
  excludeAssetId: string,
  limit: number = 4
): Promise<AssetWithCategory[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("assets")
    .select(
      "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)"
    )
    .eq("category_id", categoryId)
    .eq("is_approved", true)
    .neq("id", excludeAssetId)
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("downloads_count", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (rows ?? []).map((row: Record<string, unknown>) => {
    const { author, category, ...asset } = row;
    return {
      ...asset,
      author: author ?? null,
      category: category ?? null,
    } as AssetWithCategory;
  });
}

export interface PurchaseWithAsset {
  purchase: Purchase;
  asset: AssetWithCategory;
  hasReview: boolean;
}

export interface GetPurchasesParams {
  search?: string;
  category?: string;
}

/** User's purchases with asset and category; optional search and category filter. */
export async function getPurchasesForUser(
  userId: string,
  params: GetPurchasesParams = {}
): Promise<PurchaseWithAsset[]> {
  const supabase = await createClient();
  const { search = "", category: categorySlug = "" } = params;

  const { data: purchaseRows, error: purchaseError } = await supabase
    .from("purchases")
    .select(
      "id, user_id, asset_id, amount, stripe_id, created_at, asset:assets!inner(*, category:categories(id, name, slug))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (purchaseError || !purchaseRows?.length) return [];

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("asset_id")
    .eq("user_id", userId);

  const reviewedAssetIds = new Set(
    (reviewRows ?? []).map((r: { asset_id: string }) => r.asset_id)
  );

  const results: PurchaseWithAsset[] = [];
  for (const row of purchaseRows as Record<string, unknown>[]) {
    const assetRel = row.asset as Record<string, unknown> | null;
    if (!assetRel) continue;
    const { category, ...assetFields } = assetRel;
    const asset = {
      ...assetFields,
      author: null,
      category: category ?? null,
    } as unknown as AssetWithCategory;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matches =
        (asset.title?.toLowerCase().includes(term)) ||
        (asset.description?.toLowerCase().includes(term));
      if (!matches) continue;
    }
    if (categorySlug.trim()) {
      const cat = asset.category as { slug?: string } | null;
      if (!cat || cat.slug !== categorySlug.trim()) continue;
    }

    const purchase = {
      id: row.id,
      user_id: row.user_id,
      asset_id: row.asset_id,
      amount: row.amount,
      stripe_id: row.stripe_id,
      created_at: row.created_at,
    } as Purchase;

    results.push({
      purchase,
      asset,
      hasReview: reviewedAssetIds.has(purchase.asset_id),
    });
  }

  return results;
}
