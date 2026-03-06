import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Package, Star } from "lucide-react";
import type { Asset } from "@/types";
import { AssetRowActions } from "./AssetRowActions";

export const dynamic = "force-dynamic";

type AssetRow = Asset & {
  category?: { name: string }[] | null;
  sales_count?: number;
  revenue_cents?: number;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function getStatus(
  isApproved: boolean,
  rejectionReason?: string | null
): "Pending" | "Approved" | "Rejected" {
  if (isApproved) return "Approved";
  if (rejectionReason) return "Rejected";
  return "Pending";
}

function matchesFilter(
  row: AssetRow,
  filter: StatusFilter
): boolean {
  const status = getStatus(row.is_approved, row.rejection_reason);
  if (filter === "all") return true;
  if (filter === "pending") return status === "Pending";
  if (filter === "approved") return status === "Approved";
  if (filter === "rejected") return status === "Rejected";
  return true;
}

async function getMyAssets(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assets")
    .select(
      "id, title, slug, description, price, category_id, file_url, preview_images, tags, engine, is_approved, rejection_reason, downloads_count, rating_avg, author_id, created_at, category:categories(name)"
    )
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as AssetRow[];
}

async function getSalesByAsset(assetIds: string[]) {
  if (assetIds.length === 0) return new Map<string, { count: number; revenueCents: number }>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("asset_id, amount")
    .in("asset_id", assetIds);

  const map = new Map<string, { count: number; revenueCents: number }>();
  for (const row of data ?? []) {
    const cur = map.get(row.asset_id) ?? { count: 0, revenueCents: 0 };
    cur.count += 1;
    cur.revenueCents += row.amount ?? 0;
    map.set(row.asset_id, cur);
  }
  return map;
}

function StatusBadge({
  isApproved,
  rejectionReason,
}: {
  isApproved: boolean;
  rejectionReason?: string | null;
}) {
  const status = getStatus(isApproved, rejectionReason);
  const variant =
    status === "Approved"
      ? "default"
      : status === "Rejected"
        ? "destructive"
        : "secondary";

  const badge = (
    <Badge variant={variant}>{status}</Badge>
  );

  if (status === "Rejected" && rejectionReason) {
    return (
      <span title={rejectionReason} className="cursor-help">
        {badge}
      </span>
    );
  }
  return badge;
}

function RatingStars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value.toFixed(1)}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= full ? "fill-amber-400 text-amber-400" : half && i === full + 1 ? "fill-amber-400/50 text-amber-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

export default async function MyAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "seller") redirect("/dashboard");

  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status.toLowerCase() : "all";
  const filter: StatusFilter =
    statusParam === "pending" || statusParam === "approved" || statusParam === "rejected"
      ? statusParam
      : "all";

  const assets = await getMyAssets(user.id);
  const sales = await getSalesByAsset(assets.map((a) => a.id));
  const rows: AssetRow[] = assets.map((a) => {
    const s = sales.get(a.id);
    return {
      ...a,
      sales_count: s?.count ?? 0,
      revenue_cents: s?.revenueCents ?? 0,
    };
  });

  const filtered = rows.filter((r) => matchesFilter(r, filter));

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
          <p className="text-muted-foreground">
            Manage your listed assets, sales, and revenue
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Asset
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">No assets yet</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Upload your first asset to start selling on the marketplace.
          </p>
          <Button asChild size="lg">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Asset
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={value === "all" ? "/my-assets" : `/my-assets?status=${value}`}>
                  {label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Asset</th>
                  <th className="px-4 py-3 text-left font-medium">Category · Engine</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sales</th>
                  <th className="px-4 py-3 text-left font-medium">Revenue</th>
                  <th className="px-4 py-3 text-left font-medium">Rating</th>
                  <th className="px-4 py-3 text-left font-medium">Published</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                          {row.preview_images?.[0] ? (
                            <Image
                              src={row.preview_images[0]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.category?.[0]?.name ?? "—"} · {row.engine}
                    </td>
                    <td className="px-4 py-3">${row.price}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        isApproved={row.is_approved}
                        rejectionReason={row.rejection_reason}
                      />
                    </td>
                    <td className="px-4 py-3">{row.sales_count ?? 0}</td>
                    <td className="px-4 py-3">
                      ${((row.revenue_cents ?? 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <RatingStars value={row.rating_avg ?? null} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AssetRowActions assetId={row.id} slug={row.slug} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No assets match the selected filter.
            </p>
          )}
        </>
      )}
    </div>
  );
}
