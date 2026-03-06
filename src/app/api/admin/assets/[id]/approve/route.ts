import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

const resend =
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM ?? "onboarding@resend.dev";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assetId } = await params;
  if (!assetId) {
    return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("id, title, author_id")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("assets")
    .update({ is_approved: true, rejection_reason: null })
    .eq("id", assetId);

  if (updateError) {
    console.error("[approve] update:", updateError);
    return NextResponse.json(
      { error: "Failed to approve asset" },
      { status: 500 }
    );
  }

  const { data: author } = await supabase
    .from("users")
    .select("email")
    .eq("id", asset.author_id)
    .single();

  if (author?.email && resend) {
    await resend.emails
      .send({
        from: fromEmail,
        to: author.email,
        subject: "Your asset has been approved!",
        html: `<p>Your asset <strong>${escapeHtml(asset.title ?? "")}</strong> has been approved and is now visible on the marketplace.</p>`,
      })
      .catch((err) => console.error("[approve] Resend:", err));
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
