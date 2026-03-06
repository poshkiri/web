"use client";

import { useState } from "react";
import { ShoppingCart, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import type { Asset } from "@/types";

interface AssetDetailActionsProps {
  assetId: string;
  slug: string;
  price: number;
  isOwned: boolean;
  isLoggedIn: boolean;
  /** Pass asset to enable Add to cart. Omit author/category/reviews to keep payload small. */
  assetForCart?: Asset | null;
}

export function AssetDetailActions({
  assetId,
  slug,
  price,
  isOwned,
  isLoggedIn,
  assetForCart,
}: AssetDetailActionsProps) {
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const isInCart = useCart((s) => s.isInCart(assetId));

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase.",
        variant: "destructive",
      });
      return;
    }
    if (isOwned) return;
    if (price <= 0) {
      toast({ title: "Free asset", description: "No checkout needed." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Checkout failed",
          description: data.error ?? "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast({
        title: "Checkout failed",
        description: "No redirect URL received",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = () => {
    setWishlisted((v) => !v);
    toast({
      title: wishlisted ? "Removed from wishlist" : "Added to wishlist",
    });
  };

  const handleAddToCart = () => {
    if (!assetForCart) return;
    if (isInCart) {
      toast({ title: "Already in cart" });
      return;
    }
    addItem(assetForCart);
    toast({ title: "Added to cart" });
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
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
      setDownloadLoading(false);
    }
  };

  if (isOwned) {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          disabled={downloadLoading}
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloadLoading ? "Preparing…" : "Download"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleWishlist}
        >
          <Heart
            className={`mr-2 h-4 w-4 ${wishlisted ? "fill-current text-primary" : ""}`}
          />
          {wishlisted ? "In Wishlist" : "Add to Wishlist"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={loading || price <= 0}
        onClick={handleBuyNow}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {loading ? "Redirecting…" : price <= 0 ? "Free" : "Buy Now"}
      </Button>
      {assetForCart && price > 0 && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isInCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isInCart ? "In Cart" : "Add to Cart"}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleWishlist}
      >
        <Heart
          className={`mr-2 h-4 w-4 ${wishlisted ? "fill-current text-primary" : ""}`}
        />
        {wishlisted ? "In Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}
