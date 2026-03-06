"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AssetsPaginationProps {
  page: number;
  totalPages: number;
  className?: string;
}

function buildPageUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `/assets?${query}` : "/assets";
}

export function AssetsPagination({
  page,
  totalPages,
  className,
}: AssetsPaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const prevUrl = buildPageUrl(searchParams, page - 1);
  const nextUrl = buildPageUrl(searchParams, page + 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pageNumbers: number[] = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  const showFirst = start > 1;
  const showLeftEllipsis = start > 2;
  const showRightEllipsis = end < totalPages - 1;
  const showLast = end < totalPages;

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        {hasPrev ? (
          <Link href={prevUrl} scroll={false}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
      </Button>

      <ul className="flex items-center gap-1">
        {showFirst && (
          <li>
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={buildPageUrl(searchParams, 1)} scroll={false}>
                1
              </Link>
            </Button>
          </li>
        )}
        {showLeftEllipsis && (
          <li className="px-1 text-muted-foreground" aria-hidden>
            …
          </li>
        )}
        {pageNumbers.map((n) => (
          <li key={n}>
            <Button
              variant={n === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <Link
                href={buildPageUrl(searchParams, n)}
                scroll={false}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </Link>
            </Button>
          </li>
        ))}
        {showRightEllipsis && (
          <li className="px-1 text-muted-foreground" aria-hidden>
            …
          </li>
        )}
        {showLast && (
          <li>
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link
                href={buildPageUrl(searchParams, totalPages)}
                scroll={false}
              >
                {totalPages}
              </Link>
            </Button>
          </li>
        )}
      </ul>

      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={!hasNext}
        aria-label="Next page"
      >
        {hasNext ? (
          <Link href={nextUrl} scroll={false}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </nav>
  );
}
