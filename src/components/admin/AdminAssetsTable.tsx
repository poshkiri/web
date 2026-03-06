"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AssetWithCategory } from "@/lib/assets-server";
import type { AdminAssetStatus } from "@/lib/admin-assets-server";
import { cn } from "@/lib/utils";

const STATUSES: { value: AdminAssetStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

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

export function AdminAssetsTable({
  initialAssets,
  initialStatus,
  initialSearch,
}: {
  initialAssets: AssetWithCategory[];
  initialStatus: AdminAssetStatus;
  initialSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rejectAssetId, setRejectAssetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const buildUrl = (updates: { status?: string; search?: string }) => {
    const p = new URLSearchParams(searchParams.toString());
    if (updates.status !== undefined) {
      if (updates.status === "all") p.delete("status");
      else p.set("status", updates.status);
    }
    if (updates.search !== undefined) {
      if (!updates.search.trim()) p.delete("search");
      else p.set("search", updates.search.trim());
    }
    const q = p.toString();
    return q ? `/admin/assets?${q}` : "/admin/assets";
  };

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/assets/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to approve");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectOpen = (id: string) => {
    setRejectAssetId(id);
    setRejectReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectAssetId) return;
    setLoadingId(rejectAssetId);
    try {
      const res = await fetch(`/api/admin/assets/${rejectAssetId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to reject");
      }
      setRejectAssetId(null);
      setRejectReason("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <nav className="flex gap-2">
          {STATUSES.map(({ value, label }) => (
            <Link
              key={value}
              href={buildUrl({ status: value })}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                initialStatus === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form method="get" action="/admin/assets" className="flex gap-2">
          {initialStatus !== "all" && (
            <input type="hidden" name="status" value={initialStatus} />
          )}
          <Input
            name="search"
            placeholder="Search by title or author..."
            defaultValue={initialSearch}
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 font-medium">Preview / Title / Author</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Engine</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Submitted</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No assets found.
                </td>
              </tr>
            ) : (
              initialAssets.map((asset) => {
                const author = asset.author as {
                  id: string;
                  name: string | null;
                  email: string;
                } | null;
                const category = asset.category as { name: string } | null;
                const isPending = !asset.is_approved && !asset.rejection_reason;
                const loading = loadingId === asset.id;
                return (
                  <tr key={asset.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                          {asset.preview_images?.[0] ? (
                            <Image
                              src={asset.preview_images[0]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No preview
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{asset.title}</div>
                          <div className="text-muted-foreground">
                            {author?.name ?? author?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{category?.name ?? "—"}</td>
                    <td className="p-3">{asset.engine}</td>
                    <td className="p-3">${asset.price.toFixed(2)}</td>
                    <td className="p-3">{formatDate(asset.created_at)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/assets/${asset.slug}`} target="_blank" rel="noopener">
                            Preview
                          </Link>
                        </Button>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              disabled={loading}
                              onClick={() => handleApprove(asset.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={loading}
                              onClick={() => handleRejectOpen(asset.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectAssetId} onOpenChange={(open) => !open && setRejectAssetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for rejection</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain what needs to be changed..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectAssetId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!!loadingId} onClick={handleRejectSubmit}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
