import { AssetCardSkeleton } from "@/components/assets/AssetCard";

const SKELETON_COUNT = 12;

export function AssetsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <AssetCardSkeleton key={i} />
      ))}
    </div>
  );
}
