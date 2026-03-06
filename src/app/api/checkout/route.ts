import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

/** POST body: { assetId: string }. Creates Stripe Checkout session or returns alreadyPurchased. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const assetId =
      typeof body.assetId === "string" ? body.assetId.trim() : null;
    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, title, slug, price, preview_images")
      .eq("id", assetId)
      .eq("is_approved", true)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found or not approved" },
        { status: 404 }
      );
    }

    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("asset_id", asset.id)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { alreadyPurchased: true },
        { status: 200 }
      );
    }

    if (Number(asset.price) <= 0) {
      return NextResponse.json(
        { error: "Free assets do not require checkout" },
        { status: 400 }
      );
    }

    const priceCents = Math.round(Number(asset.price) * 100);
    const previewImages = Array.isArray(asset.preview_images)
      ? asset.preview_images
      : [];
    const firstPreview = previewImages[0];
    const previewImageUrl =
      typeof firstPreview === "string" && firstPreview.startsWith("http")
        ? firstPreview
        : undefined;

    const result = await createCheckoutSession({
      userId: user.id,
      assetId: asset.id,
      price: priceCents,
      slug: asset.slug,
      assetTitle: asset.title ?? undefined,
      previewImageUrl,
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
    });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
