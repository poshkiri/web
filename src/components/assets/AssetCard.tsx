"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Asset, AssetWithAuthor } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function isAssetWithAuthor(asset: Asset | AssetWithAuthor): asset is AssetWithAuthor {
  return "author" in asset && asset.author != null;
}

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

function formatDownloads(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export interface AssetCardProps {
  asset: Asset | AssetWithAuthor;
  categoryName?: string;
  reviewsCount?: number;
  owned?: boolean;
  className?: string;
}

export function AssetCard({
  asset,
  categoryName,
  reviewsCount = 0,
  owned = false,
  className,
}: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const author = isAssetWithAuthor(asset) ? asset.author : null;
  const previewMain = asset.preview_images[0];
  const previewHover = asset.preview_images[1];
  const showSecondImage = isHovered && previewHover != null;
  const rating = asset.rating_avg ?? 0;

  return (
    <Link href={`/assets/${asset.slug}`} className={cn("block", className)}>
      <Card
        className={cn(
          "group relative overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-300",
          "hover:border-primary/40 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)_/_.25)]",
          "focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 focus-within:ring-offset-background"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Preview image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {previewMain ? (
            <>
              <Image
                src={previewMain}
                alt={asset.title}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  showSecondImage ? "opacity-0" : "opacity-100"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
              />
              {previewHover && (
                <Image
                  src={previewHover}
                  alt=""
                  aria-hidden
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    showSecondImage ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground">
              <span className="text-sm">No preview</span>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {categoryName && (
              <Badge
                variant="secondary"
                className="border-border/60 bg-background/90 text-xs backdrop-blur-sm"
              >
                {categoryName}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="border-border/60 bg-background/90 text-xs backdrop-blur-sm"
            >
              {asset.engine}
            </Badge>
            {owned && (
              <Badge className="border-0 bg-primary/90 text-primary-foreground">
                Owned
              </Badge>
            )}
          </div>

          {/* Quick View (hover) */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100"
            )}
          >
            <Button
              asChild
              size="sm"
              className="shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/assets/${asset.slug}`}>Quick View</Link>
            </Button>
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <h3 className="line-clamp-2 font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {asset.title}
          </h3>

          {/* Author */}
          {author && (
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                {author.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                    {(author.name ?? author.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="truncate text-sm text-muted-foreground">
                {author.name ?? author.email}
              </span>
            </div>
          )}

          {/* Rating + reviews */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5 font-medium text-amber-400">
              ★ {rating > 0 ? rating.toFixed(1) : "—"}
            </span>
            {reviewsCount > 0 && (
              <span>({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})</span>
            )}
          </div>

          {/* Price + downloads */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span
              className={cn(
                "font-semibold",
                asset.price === 0 ? "text-emerald-400" : "text-foreground"
              )}
            >
              {formatPrice(asset.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDownloads(asset.downloads_count)} downloads
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function AssetCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card",
        className
      )}
    >
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full max-w-[85%]" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
        <div className="flex justify-between border-t border-border/60 pt-3">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
