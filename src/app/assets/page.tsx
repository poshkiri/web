import { Suspense } from "react";
import { FiltersPanel } from "@/components/assets/FiltersPanel";
import { SearchBar } from "@/components/assets/SearchBar";
import { AssetCard } from "@/components/assets/AssetCard";
import { AssetsPagination } from "@/components/assets/AssetsPagination";
import { AssetsEmptyState } from "@/components/assets/AssetsEmptyState";
import { AssetsGridSkeleton } from "@/components/assets/AssetsGridSkeleton";
import { getAssetsPage } from "@/lib/assets-server";
import type { AssetsSearchParams } from "@/lib/assets-server";

async function AssetsContent({
  searchParams,
}: {
  searchParams: AssetsSearchParams;
}) {
  const { assets, totalCount, page, totalPages } = await getAssetsPage(
    searchParams
  );

  return (
    <>
      <div className="mb-4">
        <SearchBar resultCount={totalCount} className="max-w-md" />
      </div>
      {assets.length === 0 ? (
        <AssetsEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                categoryName={asset.category?.name}
              />
            ))}
          </div>
          <div className="mt-8">
            <AssetsPagination
              page={page}
              totalPages={totalPages}
            />
          </div>
        </>
      )}
    </>
  );
}

export default async function AssetsPage({
  searchParams = {},
}: {
  searchParams?: AssetsSearchParams;
}) {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-semibold">Asset catalog</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop: sticky filters sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 self-start">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
              <FiltersPanel />
            </Suspense>
          </div>
        </aside>

        {/* Mobile: filters sheet trigger (FiltersPanel renders it) */}
        <div className="lg:hidden">
          <div className="mb-4">
            <Suspense fallback={<div className="h-12 animate-pulse rounded-md bg-muted" />}>
              <FiltersPanel />
            </Suspense>
          </div>
        </div>

        {/* Main content: search + grid + pagination */}
        <div className="min-w-0">
          <Suspense fallback={<AssetsGridSkeleton />}>
            <AssetsContent searchParams={searchParams ?? {}} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
