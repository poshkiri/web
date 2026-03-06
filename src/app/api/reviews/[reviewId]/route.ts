import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ reviewId: string }> };

/** DELETE: only review author or admin can delete. */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { reviewId } = await params;
    if (!reviewId) {
      return NextResponse.json(
        { error: "Missing reviewId" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const isAuthor = review.user_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: only the author or an admin can delete this review" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("[reviews] delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[reviews] DELETE", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
