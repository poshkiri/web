"use client";

import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Asset, AssetFilters, Engine } from "@/types";

export function useAssets() {
  const supabase = useMemo(() => createClient(), []);

  const fetchAssets = useCallback(
    async (filters: AssetFilters) => {
      let query = supabase
        .from("assets")
        .select(
          "id, title, slug, description, price, category_id, file_url, preview_images, tags, engine, is_approved, downloads_count, rating_avg, author_id, created_at"
        )
        .eq("is_approved", true);

      if (filters.category) {
        query = query.eq("category_id", filters.category);
      }
      if (filters.engine) {
        query = query.eq("engine", filters.engine as Engine);
      }
      if (filters.minPrice != null) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice != null) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters.search?.trim()) {
        query = query.or(
          `title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%`
        );
      }

      const sort = filters.sort ?? "created_at";
      const [field, order] = sort.startsWith("-")
        ? [sort.slice(1), "desc" as const]
        : [sort, "asc" as const];
      query = query.order(field, { ascending: order === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Asset[];
    },
    [supabase]
  );

  const fetchAssetBySlug = useCallback(
    async (slug: string) => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          "id, title, slug, description, price, category_id, file_url, preview_images, tags, engine, is_approved, downloads_count, rating_avg, author_id, created_at"
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Asset;
    },
    [supabase]
  );

  return { fetchAssets, fetchAssetBySlug };
}
