import { createClient } from "@/lib/supabase/server";
import type { AssetWithCategory } from "@/lib/assets-server";

export type AdminAssetStatus = "all" | "pending" | "approved" | "rejected";

export interface GetAdminAssetsParams {
  status?: AdminAssetStatus;
  search?: string;
}

export async function getAdminAssets(
  params: GetAdminAssetsParams = {}
): Promise<AssetWithCategory[]> {
  const supabase = await createClient();
  const { status = "all", search = "" } = params;

  let query = supabase
    .from("assets")
    .select(
      "*, author:users!author_id(id, email, name, avatar_url), category:categories(id, name, slug)"
    )
    .order("created_at", { ascending: false });

  if (status === "pending") {
    query = query.eq("is_approved", false).is("rejection_reason", null);
  } else if (status === "approved") {
    query = query.eq("is_approved", true);
  } else   if (status === "rejected") {
    query = query.eq("is_approved", false).not("rejection_reason", "is", null);
  }

  if (search.trim()) {
    const term = search.trim().replace(/'/g, "''");
    query = query.or(`title.ilike.%${term}%`);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("getAdminAssets error:", error);
    return [];
  }

  let results = (rows ?? []).map((row: Record<string, unknown>) => {
    const { author, category, ...asset } = row;
    return {
      ...asset,
      author: author ?? null,
      category: category ?? null,
    } as AssetWithCategory;
  });

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    results = results.filter((a) => {
      const byTitle = a.title?.toLowerCase().includes(term);
      const author = a.author as { name?: string | null; email?: string } | null;
      const byAuthor =
        author &&
        (author.name?.toLowerCase().includes(term) ||
          author.email?.toLowerCase().includes(term));
      return byTitle || byAuthor;
    });
  }

  return results;
}