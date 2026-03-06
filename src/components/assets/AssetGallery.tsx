"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AssetGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export function AssetGallery({
  images,
  title,
  className,
}: AssetGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mainImage = images[selectedIndex] ?? images[0];

  if (!images.length) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground",
          className
        )}
      >
        <span className="text-sm">No preview</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        {mainImage && (
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                selectedIndex === i
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/60"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
