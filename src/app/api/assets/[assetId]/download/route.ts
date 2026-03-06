import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userHasPurchased } from "@/lib/assets-server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ error: "Missing asset id or slug" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return NextResponse.json(
      { error: "Sign in to download" },
      { status: 401 }
    );
  }

  const byId = UUID_REGEX.test(assetId);
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id, file_url")
    .eq(byId ? "id" : "slug", assetId)
    .single();

  if (assetError || !asset) {
    return NextResponse.json(
      { error: "Asset not found" },
      { status: 404 }
    );
  }

  const owned = await userHasPurchased(user.id, asset.id);
  if (!owned) {
    return NextResponse.json(
      { error: "Purchase required to download" },
      { status: 403 }
    );
  }

  const fileUrl = asset.file_url;
  if (!fileUrl || typeof fileUrl !== "string") {
    return NextResponse.json(
      { error: "Download not available" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(fileUrl, 302);
}
