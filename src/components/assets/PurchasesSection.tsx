"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurchaseCard } from "@/components/assets/PurchaseCard";
import { ReviewModal } from "@/components/assets/ReviewModal";
import type { PurchaseWithAsset } from "@/lib/assets-server";
import type { Category } from "@/types";

export interface PurchasesSectionProps {
  purchases: PurchaseWithAsset[];
  categories: Category[];
  initialSearch: string;
  initialCategory: string;
}

export function PurchasesSection({
  purchases,
  categories,
  initialSearch,
  initialCategory,
}: PurchasesSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [reviewAsset, setReviewAsset] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  React.useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  const updateParams = React.useCallback(
    (search: string, category: string) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category.trim()) params.set("category", category.trim());
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router]
  );

  const handleSearchBlur = () => {
    updateParams(searchInput, initialCategory);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateParams(searchInput, initialCategory);
    }
  };

  const handleCategoryChange = (value: string) => {
    updateParams(searchInput, value);
  };

  const handleReviewSuccess = () => {
    setReviewAsset(null);
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search purchased assets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
            aria-label="Search purchased assets"
          />
        </div>
        <Select
          value={initialCategory || "all"}
          onValueChange={(v) => handleCategoryChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {purchases.map((item) => (
          <PurchaseCard
            key={item.purchase.id}
            item={item}
            onLeaveReview={(assetId, assetTitle) =>
              setReviewAsset({ id: assetId, title: assetTitle })
            }
          />
        ))}
      </div>

      <ReviewModal
        open={!!reviewAsset}
        onOpenChange={(open) => !open && setReviewAsset(null)}
        assetId={reviewAsset?.id ?? null}
        assetTitle={reviewAsset?.title}
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}
