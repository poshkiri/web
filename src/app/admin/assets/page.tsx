import { Suspense } from "react";
import Link from "next/link";
import { getAdminAssets } from "@/lib/admin-assets-server";
import type { AdminAssetStatus } from "@/lib/admin-assets-server";
import { AdminAssetsTable } from "@/components/admin/AdminAssetsTable";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ status?: string; search?: string }>;
};

function parseStatus(value: string | undefined): AdminAssetStatus {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

export default async function AdminAssetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const search = typeof params.search === "string" ? params.search : "";

  const assets = await getAdminAssets({ status, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to admin
        </Link>
        <h1 className="text-2xl font-semibold">Assets on moderation</h1>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <AdminAssetsTable
          initialAssets={assets}
          initialStatus={status}
          initialSearch={search}
        />
      </Suspense>
    </div>
  );
}
