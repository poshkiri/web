"use client";

import * as React from "react";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReviewWithUser } from "@/types";

const PAGE_SIZE = 5;

export type ReviewSort = "newest" | "helpful";

export interface ReviewListItem extends ReviewWithUser {
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email?: string;
  };
}

export interface RatingBreakdownItem {
  star: number;
  count: number;
  percent: number;
}

export interface ReviewsListProps {
  assetId: string;
  /** Current user id for delete button; null = not logged in */
  currentUserId: string | null;
  /** Show delete for any review (admin) */
  isAdmin?: boolean;
  /** When this value changes, list refetches (e.g. after form submit) */
  refreshTrigger?: number;
  onRefetch?: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ReviewsList({
  assetId,
  currentUserId,
  isAdmin = false,
  refreshTrigger,
  onRefetch,
}: ReviewsListProps) {
  const [sort, setSort] = React.useState<ReviewSort>("newest");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<{
    reviews: ReviewListItem[];
    totalCount: number;
    page: number;
    totalPages: number;
    ratingAvg: number | null;
    ratingBreakdown: RatingBreakdownItem[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        assetId,
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      const res = await fetch(`/api/reviews?${params}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        return;
      }
      setData({
        reviews: json.reviews ?? [],
        totalCount: json.totalCount ?? 0,
        page: json.page ?? 1,
        totalPages: json.totalPages ?? 1,
        ratingAvg: json.ratingAvg ?? null,
        ratingBreakdown: json.ratingBreakdown ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, [assetId, page, sort]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        fetchReviews();
        onRefetch?.();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (review: ReviewListItem) =>
    currentUserId && (review.user_id === currentUserId || isAdmin);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading reviews…
        </CardContent>
      </Card>
    );
  }

  const reviews = data?.reviews ?? [];
  const totalCount = data?.totalCount ?? 0;
  const ratingAvg = data?.ratingAvg ?? null;
  const ratingBreakdown = data?.ratingBreakdown ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall rating + breakdown */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {ratingAvg != null ? ratingAvg.toFixed(1) : "—"}
              </span>
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-sm text-muted-foreground">out of 5</span>
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const item = ratingBreakdown.find((b) => b.star === star);
                const count = item?.count ?? 0;
                const percent = item?.percent ?? 0;
                return (
                  <div
                    key={star}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex w-12 items-center gap-0.5 text-muted-foreground">
                      {star}
                      <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sort */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex rounded-md border border-input bg-background p-0.5">
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-1 text-sm font-medium transition-colors",
                  sort === "newest"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setSort("newest")}
              >
                Newest
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-1 text-sm font-medium transition-colors",
                  sort === "helpful"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setSort("helpful")}
              >
                Most Helpful
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                  {r.user?.avatar_url ? (
                    <Image
                      src={r.user.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                      {(r.user?.name ?? r.user?.email ?? "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {r.user?.name ?? r.user?.email ?? "Anonymous"}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {r.rating}
                      </span>
                    </div>
                    {canDelete(r) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
