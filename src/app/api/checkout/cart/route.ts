import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { createCartCheckoutSession } from "@/lib/stripe";

/** POST body: { assetIds: string[] }. Creates one Stripe Checkout session for all items; excludes already purchased. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIds = body.assetIds;
    const assetIds = Array.isArray(rawIds)
      ? (rawIds as unknown[])
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    if (assetIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty assetIds" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: purchases } = await supabase
      .from("purchases")
      .select("asset_id")
      .eq("user_id", user.id)
      .in("asset_id", assetIds);

    const purchasedSet = new Set(
      (purchases ?? []).map((p) => p.asset_id as string)
    );
    const remainingIds = assetIds.filter((id) => !purchasedSet.has(id));

    if (remainingIds.length === 0) {
      return NextResponse.json(
        { error: "All selected assets are already purchased", alreadyPurchasedIds: assetIds },
        { status: 400 }
      );
    }

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("id, title, slug, price, preview_images")
      .in("id", remainingIds)
      .eq("is_approved", true);

    if (assetsError || !assets?.length) {
      return NextResponse.json(
        { error: "No valid assets found" },
        { status: 404 }
      );
    }

    const payables = assets.filter((a) => Number(a.price) > 0);
    if (payables.length === 0) {
      return NextResponse.json(
        { error: "All selected assets are free; no checkout needed" },
        { status: 400 }
      );
    }

    const previewImages = (a: { preview_images?: unknown }) =>
      Array.isArray(a.preview_images) ? a.preview_images : [];
    const firstPreview = (a: { preview_images?: unknown[] }) => {
      const arr = previewImages(a);
      const first = arr[0];
      return typeof first === "string" && first.startsWith("http")
        ? first
        : undefined;
    };

    const result = await createCartCheckoutSession({
      userId: user.id,
      items: payables.map((a) => ({
        assetId: a.id,
        price: Math.round(Number(a.price) * 100),
        slug: a.slug,
        assetTitle: a.title ?? undefined,
        previewImageUrl: firstPreview(a),
      })),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
      alreadyPurchasedIds: Array.from(purchasedSet),
    });
  } catch (err) {
    console.error("[checkout/cart]", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
