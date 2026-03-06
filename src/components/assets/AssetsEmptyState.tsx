import Link from "next/link";
import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssetsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <PackageX className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        No assets found
      </h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Try adjusting your filters or search to find what you&apos;re looking for.
      </p>
      <Button variant="outline" asChild>
        <Link href="/assets">Clear filters</Link>
      </Button>
    </div>
  );
}
