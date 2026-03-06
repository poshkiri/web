"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ShoppingCart } from "lucide-react";
import type { Category } from "@/types";
import type { BasicInfoFormValues } from "./StepBasicInfo";
import type { StepFilesValues } from "./StepFiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

function licenseLabel(license: "personal" | "commercial"): string {
  return license === "commercial" ? "Commercial" : "Personal";
}

export interface StepPreviewProps {
  basicInfo: BasicInfoFormValues;
  files: StepFilesValues;
  categories: Category[];
  onBack: () => void;
}

/** Build preview image URLs from File[] and revoke when unmount or when files change. */
function usePreviewUrls(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>(() =>
    files.map((f) => URL.createObjectURL(f))
  );

  const fileKey = useMemo(
    () => files.map((f) => `${f.name}-${f.size}`).join(","),
    [files]
  );

  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return next;
    });
    return () => {
      setUrls((current) => {
        current.forEach(URL.revokeObjectURL);
        return [];
      });
    };
  }, [fileKey]);

  return urls;
}

/** Catalog-style card preview using the same layout as AssetCard (no link). */
function CatalogCardPreview({
  title,
  categoryName,
  engine,
  price,
  previewUrls,
  authorLabel,
}: {
  title: string;
  categoryName?: string;
  engine: string;
  price: number;
  previewUrls: string[];
  authorLabel: string;
}) {
  const previewMain = previewUrls[0];
  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {previewMain ? (
          <img
            src={previewMain}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground">
            <span className="text-sm">No preview</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {categoryName && (
            <Badge
              variant="secondary"
              className="border-border/60 bg-background/90 text-xs backdrop-blur-sm"
            >
              {categoryName}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="border-border/60 bg-background/90 text-xs backdrop-blur-sm"
          >
            {engine}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {authorLabel[0].toUpperCase()}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {authorLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-amber-400">★ —</span>
          <span>(0 reviews)</span>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span
            className={cn(
              "font-semibold",
              price === 0 ? "text-emerald-400" : "text-foreground"
            )}
          >
            {formatPrice(price)}
          </span>
          <span className="text-xs text-muted-foreground">0 downloads</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Asset page preview: gallery + metadata + price + disabled button. */
function AssetPagePreview({
  title,
  description,
  categoryName,
  engine,
  licenseType,
  price,
  tags,
  previewUrls,
  authorLabel,
}: {
  title: string;
  description: string;
  categoryName?: string;
  engine: string;
  licenseType: "personal" | "commercial";
  price: number;
  tags: string[];
  previewUrls: string[];
  authorLabel: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mainImage = previewUrls[selectedIndex] ?? previewUrls[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        {/* Gallery */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Gallery preview
          </h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <span className="text-sm">No preview</span>
              </div>
            )}
          </div>
          {previewUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewUrls.map((src, i) => (
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
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {description && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Description</h3>
            <div className="asset-description max-w-none rounded-lg border border-border bg-card p-4 text-sm [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          </section>
        )}

        {tags.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-default"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside>
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {authorLabel[0].toUpperCase()}
              </span>
              <span>{authorLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryName && (
                <Badge variant="secondary">{categoryName}</Badge>
              )}
              <Badge variant="secondary">{engine}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              {formatPrice(price)}
            </div>
            <Button size="lg" className="w-full" disabled>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {price <= 0 ? "Free" : "Buy Now"}
            </Button>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">License</dt>
                <dd>{licenseLabel(licenseType)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Downloads</dt>
                <dd>0</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

export function StepPreview({
  basicInfo,
  files,
  categories,
  onBack,
}: StepPreviewProps) {
  const router = useRouter();
  const previewUrls = usePreviewUrls(files.previewImages);
  const [confirmOriginal, setConfirmOriginal] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryName = useMemo(
    () => categories.find((c) => c.id === basicInfo.categoryId)?.name,
    [categories, basicInfo.categoryId]
  );

  const canSubmit =
    confirmOriginal &&
    confirmTerms &&
    files.zipFile != null &&
    files.previewImages.length > 0;

  const buildFormData = useCallback((): FormData => {
    const form = new FormData();
    form.set("title", basicInfo.title.trim());
    form.set("description", basicInfo.description.trim());
    form.set("price", String(Math.round(Number(basicInfo.price))));
    form.set("category_id", basicInfo.categoryId);
    form.set("engine", basicInfo.engine);
    form.set("license_type", basicInfo.license_type);
    form.set("tags", JSON.stringify(basicInfo.tags ?? []));
    if (files.zipFile) form.set("file", files.zipFile);
    files.previewImages.forEach((file) => {
      form.append("preview_images", file);
    });
    return form;
  }, [basicInfo, files]);

  const submitForReview = useCallback(async () => {
    if (!canSubmit || !files.zipFile) return;
    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    const form = buildFormData();
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(pct);
      }
    });

    const done = (success: boolean) => {
      setSubmitting(false);
      setUploadProgress(null);
      if (success) {
        router.push("/dashboard/my-assets?submitted=true");
      }
    };

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        done(true);
        return;
      }
      let msg = "Upload failed";
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        // ignore
      }
      setError(msg);
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
      done(false);
    });

    xhr.addEventListener("error", () => {
      setError("Network error");
      toast({
        title: "Upload failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      done(false);
    });

    xhr.open("POST", "/api/assets/upload");
    xhr.send(form);
  }, [canSubmit, files.zipFile, buildFormData, router]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          How it will look in the catalog
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This is how your asset card will appear in the marketplace grid.
        </p>
        <div className="max-w-sm">
          <CatalogCardPreview
            title={basicInfo.title}
            categoryName={categoryName}
            engine={basicInfo.engine}
            price={Number(basicInfo.price)}
            previewUrls={previewUrls}
            authorLabel="You"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          How the asset page will look
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Preview of /assets/[slug]: gallery, metadata, and purchase area.
        </p>
        <div className="rounded-lg border border-border bg-background p-4">
          <AssetPagePreview
            title={basicInfo.title}
            description={basicInfo.description}
            categoryName={categoryName}
            engine={basicInfo.engine}
            licenseType={basicInfo.license_type}
            price={Number(basicInfo.price)}
            tags={basicInfo.tags ?? []}
            previewUrls={previewUrls}
            authorLabel="You"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Confirm before submit</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 hover:bg-muted/50">
            <input
              type="checkbox"
              checked={confirmOriginal}
              onChange={(e) => setConfirmOriginal(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">
              I confirm this asset is my original work
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 hover:bg-muted/50">
            <input
              type="checkbox"
              checked={confirmTerms}
              onChange={(e) => setConfirmTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">I agree to the Terms of Service</span>
          </label>
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {uploadProgress != null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Uploading files…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          ← Back
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={!canSubmit || submitting}
          onClick={submitForReview}
        >
          {submitting ? "Uploading…" : "Submit for Review"}
        </Button>
      </div>
    </div>
  );
}
