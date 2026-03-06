import { NextResponse } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

const ASSETS_BUCKET = "assets";
const PREVIEWS_BUCKET = "previews";

/**
 * DELETE /api/assets/[assetId]
 * - Requires auth; caller must be the asset author.
 * - Removes files from Storage (assets + previews buckets).
 * - Deletes the asset row from DB.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("id, author_id")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (asset.author_id !== user.id) {
    return NextResponse.json(
      { error: "Only the author can delete this asset" },
      { status: 403 }
    );
  }

  const prefix = `${asset.author_id}/${assetId}`;

  async function listAndRemovePaths(bucket: string): Promise<string[]> {
    const { data: items, error } = await supabase.storage
      .from(bucket)
      .list(prefix);

    if (error) {
      console.error(`[DELETE asset] list ${bucket}:`, error);
      return [];
    }
    if (!items?.length) return [];

    const paths = items.map((item) => `${prefix}/${item.name}`);
    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove(paths);
    if (removeError) {
      console.error(`[DELETE asset] remove ${bucket}:`, removeError);
    }
    return paths;
  }

  await Promise.all([
    listAndRemovePaths(ASSETS_BUCKET),
    listAndRemovePaths(PREVIEWS_BUCKET),
  ]);

  const { error: deleteError } = await supabase
    .from("assets")
    .delete()
    .eq("id", assetId);

  if (deleteError) {
    console.error("[DELETE asset] db delete:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete asset record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
