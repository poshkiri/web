import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { userHasPurchased } from "@/lib/assets-server";

const RATING_MIN = 1;
const RATING_MAX = 5;
const COMMENT_MIN = 10;
const COMMENT_MAX = 500;
const DEFAULT_PAGE_SIZE = 5;

/** POST body: { assetId: string, rating: number, comment: string }. Creates a review. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const assetId =
      typeof body.assetId === "string" ? body.assetId.trim() : null;
    const rating =
      typeof body.rating === "number" && Number.isFinite(body.rating)
        ? Math.round(body.rating)
        : null;
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";

    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      );
    }
    if (rating == null || rating < RATING_MIN || rating > RATING_MAX) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (comment.length < COMMENT_MIN || comment.length > COMMENT_MAX) {
      return NextResponse.json(
        { error: "Comment must be between 10 and 500 characters" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owned = await userHasPurchased(user.id, assetId);
    if (!owned) {
      return NextResponse.json(
        { error: "Purchase required to review" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("asset_id", assetId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this asset" },
        { status: 409 }
      );
    }

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        asset_id: assetId,
        rating,
        comment,
      })
      .select("id, user_id, asset_id, rating, comment, created_at")
      .single();

    if (insertError) {
      console.error("[reviews] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save review" },
        { status: 500 }
      );
    }

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("[reviews]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET ?assetId=...&page=1&limit=5&sort=newest|helpful. Returns reviews, totalCount, ratingAvg, ratingBreakdown. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId")?.trim() ?? null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
    const sort = (searchParams.get("sort") ?? "newest") === "helpful" ? "helpful" : "newest";

    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("reviews")
      .select("id, user_id, asset_id, rating, comment, created_at, user:users(id, name, avatar_url, email)", { count: "exact" })
      .eq("asset_id", assetId);

    if (sort === "helpful") {
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: rows, error, count } = await query.range(from, to);

    if (error) {
      console.error("[reviews] GET error:", error);
      return NextResponse.json(
        { error: "Failed to load reviews" },
        { status: 500 }
      );
    }

    const totalCount = count ?? 0;
    const reviews = (rows ?? []).map((r: Record<string, unknown>) => {
      const { user, ...rest } = r;
      return { ...rest, user: user ?? {} };
    });

    const { data: allRatings } = await supabase
      .from("reviews")
      .select("rating")
      .eq("asset_id", assetId);

    const ratingCounts = [0, 0, 0, 0, 0];
    let sum = 0;
    (allRatings ?? []).forEach((row: { rating: number }) => {
      const r = Number(row.rating);
      if (r >= 1 && r <= 5) {
        ratingCounts[5 - r]++;
        sum += r;
      }
    });
    const totalRatings = ratingCounts.reduce((a, b) => a + b, 0);
    const ratingAvg = totalRatings > 0 ? Math.round((sum / totalRatings) * 100) / 100 : null;
    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratingCounts[5 - star],
      percent: totalRatings > 0 ? Math.round((ratingCounts[5 - star] / totalRatings) * 100) : 0,
    }));

    return NextResponse.json({
      reviews,
      totalCount,
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      ratingAvg,
      ratingBreakdown,
    });
  } catch (err) {
    console.error("[reviews] GET", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
