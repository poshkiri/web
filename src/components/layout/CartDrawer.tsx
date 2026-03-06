"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useCartItemCount, useCartTotalPrice } from "@/hooks/useCart";

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const items = useCart((s) => s.items);
  const itemCount = useCartItemCount();
  const totalPrice = useCartTotalPrice();
  const removeItem = useCart((s) => s.removeItem);

  async function handleCheckoutAll() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: items.map((a) => a.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? "Checkout failed";
        if (data.alreadyPurchasedIds?.length) {
          const ids = data.alreadyPurchasedIds as string[];
          ids.forEach((id) => removeItem(id));
        }
        throw new Error(msg);
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.alreadyPurchasedIds?.length && data.remainingIds?.length === 0) {
        setOpen(false);
        return;
      }
      throw new Error(data.error ?? "Checkout failed");
    } catch (err) {
      console.error("[CartDrawer] checkout:", err);
      alert(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
              aria-hidden
            >
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-hidden">
          {items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Your cart is empty.
            </p>
          ) : (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto py-4">
                {items.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex gap-3 rounded-lg border border-border/80 bg-card p-3"
                  >
                    <Link
                      href={`/assets/${asset.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      {asset.preview_images?.[0] ? (
                        <Image
                          src={asset.preview_images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/assets/${asset.slug}`}
                        onClick={() => setOpen(false)}
                        className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
                      >
                        {asset.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatPrice(Number(asset.price))}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${asset.title} from cart`}
                      onClick={() => removeItem(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/80 pt-4">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={handleCheckoutAll}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Checkout All"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
