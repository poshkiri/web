"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PurchaseWithAsset } from "@/lib/assets-server";
import { cn } from "@/lib/utils";

export interface PurchaseCardProps {
  item: PurchaseWithAsset;
  onLeaveReview: (assetId: string, assetTitle: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PurchaseCard({ item, onLeaveReview }: PurchaseCardProps) {
  const { purchase, asset, hasReview } = item;
  const categoryName =
    asset.category && typeof asset.category === "object" && "name" in asset.category
      ? (asset.category as { name: string }).name
      : null;
  const previewMain = asset.preview_images?.[0];

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/download/${asset.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Download failed");
      if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
      }
    } catch (err) {
      console.error(err);
      // Could add toast here
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card",
        "transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)_/_.25)]"
      )}
    >
      <Link href={`/assets/${asset.slug}`} className="block flex-shrink-0">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {previewMain ? (
            <Image
              src={previewMain}
              alt={asset.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground">
              <span className="text-sm">No preview</span>
            </div>
          )}
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
          </div>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/assets/${asset.slug}`} className="block">
          <h3 className="line-clamp-2 font-semibold leading-tight text-foreground hover:text-primary">
            {asset.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground">
          Purchased {formatDate(purchase.created_at)}
        </p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={handleDownload}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
          {!hasReview && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={(e) => {
                e.preventDefault();
                onLeaveReview(asset.id, asset.title);
              }}
            >
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Leave Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
