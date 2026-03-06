import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userHasPurchased } from "@/lib/assets-server";

const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const owned = await userHasPurchased(user.id, assetId);
    if (!owned) {
      return NextResponse.json(
        { error: "Purchase required" },
        { status: 403 }
      );
    }

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, file_url, downloads_count")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    const fileUrl = asset.file_url;
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Download not available" },
        { status: 404 }
      );
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("assets")
      .createSignedUrl(fileUrl, SIGNED_URL_EXPIRES_IN);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    await supabase
      .from("assets")
      .update({ downloads_count: (asset.downloads_count ?? 0) + 1 })
      .eq("id", assetId);

    return NextResponse.json({
      downloadUrl: signedData.signedUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
