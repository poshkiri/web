"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ShoppingCart, Download, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { usePurchase } from "@/hooks/usePurchase";

type ButtonState = "idle" | "loading" | "error";

function DownloadButton({ assetId }: { assetId: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/download/${assetId}`);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        downloadUrl?: string;
      };
      if (!res.ok) {
        toast({
          title: "Download failed",
          description: data.error ?? "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        toast({ title: "Download started!" });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      size="lg"
      className="w-full bg-green-600 hover:bg-green-700"
      disabled={loading}
      onClick={handleDownload}
    >
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Preparing…" : "Download Asset"}
    </Button>
  );
}

export interface BuyButtonProps {
  assetId: string;
  slug: string;
  price: number;
}

export function BuyButton({ assetId, slug, price }: BuyButtonProps) {
  const { user, loading: userLoading } = useUser();
  const {
    checkPurchase,
    purchaseAsset,
    loading: purchaseLoading,
    error: purchaseError,
  } = usePurchase();

  const [isPurchased, setIsPurchased] = useState<boolean | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>("idle");

  const refreshPurchase = useCallback(async () => {
    setCheckLoading(true);
    const owned = await checkPurchase(assetId);
    setIsPurchased(owned);
    setCheckLoading(false);
  }, [assetId, checkPurchase]);

  useEffect(() => {
    if (!assetId || !user?.id) {
      setIsPurchased(user?.id ? false : null);
      return;
    }
    refreshPurchase();
  }, [assetId, user?.id, refreshPurchase]);

  useEffect(() => {
    if (purchaseError) {
      toast({
        title: "Error",
        description: purchaseError,
        variant: "destructive",
      });
      setButtonState("error");
    }
  }, [purchaseError]);

  const handlePurchase = async () => {
    setButtonState("loading");
    await purchaseAsset(assetId);
    setButtonState("idle");
    await refreshPurchase();
  };

  const isLoading = userLoading || (user?.id != null && isPurchased === null && checkLoading);
  const isButtonLoading = buttonState === "loading" || purchaseLoading;

  if (isLoading) {
    return (
      <Skeleton className="h-11 w-full rounded-md" data-testid="buy-button-skeleton" />
    );
  }

  if (!user) {
    return (
      <Button asChild size="lg" className="w-full" variant="outline">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" />
          Login to Purchase
        </Link>
      </Button>
    );
  }

  if (isPurchased) {
    return (
      <DownloadButton assetId={assetId} />
    );
  }

  const priceLabel =
    price <= 0 ? "Free" : `Buy Now — $${Number(price).toFixed(2)}`;

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isButtonLoading || price <= 0}
      onClick={handlePurchase}
    >
      {isButtonLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting…
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {priceLabel}
        </>
      )}
    </Button>
  );
}
