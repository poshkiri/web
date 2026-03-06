"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export function usePurchase() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPurchase = useCallback(
    async (assetId: string): Promise<boolean> => {
      if (!user?.id) return false;
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("asset_id", assetId)
          .maybeSingle();

        if (err) {
          setError(err.message);
          return false;
        }
        return data != null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const purchaseAsset = useCallback(async (assetId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        alreadyPurchased?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      if (data.alreadyPurchased) {
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("No redirect URL received");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Checkout failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkPurchase, purchaseAsset, loading, error };
}
