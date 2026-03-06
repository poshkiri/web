import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Star } from "lucide-react";
import {
  getAssetBySlug,
  getMoreFromSeller,
  getSimilarAssets,
  userHasPurchased,
} from "@/lib/assets-server";
import { getCurrentUser } from "@/lib/supabase/server";
import { AssetGallery } from "@/components/assets/AssetGallery";
import { AssetCard } from "@/components/assets/AssetCard";
import { AssetDetailActions } from "@/components/assets/AssetDetailActions";
import { ReviewsSection } from "@/components/assets/ReviewsSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LicenseType } from "@/types";

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

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

function licenseLabel(license?: LicenseType | null): string {
  if (!license) return "—";
  return license === "commercial" ? "Commercial" : "Personal";
}

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://gameassets.example.com");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const asset = await getAssetBySlug(slug);
  if (!asset) {
    return { title: "Asset not found" };
  }
  const description =
    asset.description.replace(/\s+/g, " ").slice(0, 160) || undefined;
  const metaDescription =
    description ?? `Asset: ${asset.title}. ${asset.engine}. ${formatPrice(asset.price)}.`;
  const previewImages =
    Array.isArray(asset.preview_images) && asset.preview_images.length > 0
      ? asset.preview_images
      : [];
  const firstPreview = previewImages[0];
  const ogImage = firstPreview
    ? firstPreview.startsWith("http")
      ? firstPreview
      : `${BASE_URL}${firstPreview.startsWith("/") ? "" : "/"}${firstPreview}`
    : undefined;

  return {
    title: `${asset.title} — GameAssets`,
    description: metaDescription,
    openGraph: {
      title: `${asset.title} — GameAssets`,
      description: metaDescription,
      url: `${BASE_URL}/assets/${slug}`,
      siteName: "GameAssets",
      images: ogImage ? [{ url: ogImage, alt: asset.title }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${asset.title} — GameAssets`,
      description: metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function AssetDetailPage({ params }: Props) {
  const { slug } = await params;
  const [asset, currentUser] = await Promise.all([
    getAssetBySlug(slug),
    getCurrentUser(),
  ]);

  if (!asset) notFound();

  const isOwned = await userHasPurchased(currentUser?.id ?? null, asset.id);
  const hasOwnReview =
    !!currentUser &&
    asset.reviews.some(
      (r) => (r as { user?: { id?: string } }).user?.id === currentUser.id
    );
  const canReview = isOwned && !hasOwnReview;
  const [moreFromSeller, similarAssets] = await Promise.all([
    getMoreFromSeller(asset.author_id, asset.id, 4),
    getSimilarAssets(asset.category_id, asset.id, 4),
  ]);

  const author = asset.author;
  const category = asset.category;
  const rating = asset.rating_avg ?? 0;
  const reviewsCount = asset.reviewsCount;
  const previewImages =
    Array.isArray(asset.preview_images) && asset.preview_images.length > 0
      ? asset.preview_images
      : [];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: asset.title,
    description: asset.description.replace(/\s+/g, " ").slice(0, 500),
    image: previewImages.map((src) =>
      src.startsWith("http") ? src : `${BASE_URL}${src.startsWith("/") ? "" : "/"}${src}`
    ),
    offers: {
      "@type": "Offer",
      price: asset.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(rating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        reviewCount: reviewsCount,
      },
    }),
  };

  return (
    <div className="container py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left column — 60% content */}
        <div className="min-w-0 space-y-8">
          <AssetGallery
            images={previewImages}
            title={asset.title}
            className="w-full"
          />

          {asset.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Description</h2>
              <div className="asset-description max-w-none rounded-lg border border-border bg-card p-4 text-sm [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5">
                <ReactMarkdown>{asset.description}</ReactMarkdown>
              </div>
            </section>
          )}

          {asset.tags?.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/assets?search=${encodeURIComponent(tag)}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <ReviewsSection
              assetId={asset.id}
              currentUserId={currentUser?.id ?? null}
              isAdmin={currentUser?.role === "admin"}
              canReview={canReview}
            />
          </section>
        </div>

        {/* Right column — 40%, sticky */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4">
              <CardTitle className="text-xl leading-tight">
                {asset.title}
              </CardTitle>
              {author && (
                <Link
                  href={`/profile/${author.id}`}
                  className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {author.avatar_url ? (
                      <Image
                        src={author.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                        {(author.name ?? author.email)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {author.name ?? author.email}
                  </span>
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-0.5 font-medium text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  {rating > 0 ? rating.toFixed(1) : "—"}
                </span>
                <span>
                  {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {category && (
                  <Badge variant="secondary">{category.name}</Badge>
                )}
                <Badge variant="secondary">{asset.engine}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                {formatPrice(asset.price)}
              </div>
              <AssetDetailActions
                assetId={asset.id}
                slug={asset.slug}
                price={asset.price}
                isOwned={isOwned}
                isLoggedIn={!!currentUser}
                assetForCart={asset}
              />
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">License</dt>
                  <dd>{licenseLabel(asset.license_type)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Downloads</dt>
                  <dd>{asset.downloads_count.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Published</dt>
                  <dd>{formatDate(asset.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Bottom: More from seller + Similar */}
      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">More from this seller</h2>
          {moreFromSeller.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other assets.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {moreFromSeller.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  categoryName={a.category?.name}
                  reviewsCount={0}
                />
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">Similar Assets</h2>
          {similarAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No similar assets.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {similarAssets.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  categoryName={a.category?.name}
                  reviewsCount={0}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
