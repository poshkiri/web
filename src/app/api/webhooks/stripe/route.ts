import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Stripe webhook handler. In App Router the body is never auto-parsed, so we use getRawBody() for signature verification.
 * (In Pages Router you would set config.api.bodyParser = false.)
 * Note: If RLS blocks inserts/updates from webhooks, use a Supabase service role client here.
 */
async function getRawBody(request: NextRequest): Promise<string> {
  return request.text();
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const fromEmail = process.env.RESEND_FROM ?? "onboarding@resend.dev";

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.user_id;
  const assetIdsRaw = session.metadata?.asset_ids;
  const singleAssetId = session.metadata?.asset_id;
  const slug = session.metadata?.asset_slug ?? "";

  let assetIds: string[];
  if (assetIdsRaw) {
    try {
      const parsed = JSON.parse(assetIdsRaw) as unknown;
      assetIds = Array.isArray(parsed)
        ? (parsed as string[]).filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      assetIds = [];
    }
  } else if (singleAssetId) {
    assetIds = [singleAssetId];
  } else {
    assetIds = [];
  }

  if (!userId || assetIds.length === 0) {
    console.error(
      "[webhook] checkout.session.completed: missing user_id or asset_ids in metadata",
      { sessionId: session.id }
    );
    return;
  }

  const supabase = createServiceRoleClient();
  const amountTotal = session.amount_total ?? 0;
  const amountPerItemCents =
    assetIds.length > 0 ? Math.round(amountTotal / assetIds.length) : 0;

  for (const assetId of assetIds) {
    const { error: insertError } = await supabase.from("purchases").insert({
      user_id: userId,
      asset_id: assetId,
      amount: amountPerItemCents / 100,
      stripe_id: session.id,
    });

    if (insertError) {
      console.error("[webhook] Failed to insert purchase:", insertError);
      continue;
    }

    const { data: assetRow } = await supabase
      .from("assets")
      .select("downloads_count, title, author_id, slug")
      .eq("id", assetId)
      .single();

    if (assetRow) {
      await supabase
        .from("assets")
        .update({ downloads_count: (assetRow.downloads_count ?? 0) + 1 })
        .eq("id", assetId);
    }

    const authorId = assetRow?.author_id ?? null;
    if (!authorId) continue;

    const { data: seller } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", authorId)
      .single();

    const stripeAccountId = seller?.stripe_account_id ?? null;
    if (!stripeAccountId || amountPerItemCents <= 0) continue;

    const sellerAmountCents = Math.round(amountPerItemCents * 0.8);
    const platformFeeCents = amountPerItemCents - sellerAmountCents;
    if (sellerAmountCents <= 0) continue;

    try {
      const transfer = await stripe.transfers.create({
        amount: sellerAmountCents,
        currency: "usd",
        destination: stripeAccountId,
        metadata: {
          asset_id: assetId,
          seller_id: authorId,
          session_id: session.id,
        },
      });

      await supabase.from("earnings").insert({
        seller_id: authorId,
        asset_id: assetId,
        amount: Math.round((sellerAmountCents / 100) * 100) / 100,
        platform_fee: Math.round((platformFeeCents / 100) * 100) / 100,
        stripe_transfer_id: transfer.id,
        status: "pending",
      });
    } catch (transferErr) {
      console.error("[webhook] Stripe transfer failed:", transferErr);
    }
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("title, slug, author_id")
    .in("id", assetIds);

  const assetTitles = (assets ?? []).map((a) => a?.title ?? "Game Asset");
  const firstSlug = assets?.[0]?.slug ?? slug;
  const authorId = assets?.[0]?.author_id ?? null;

  const { data: buyer } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  let sellerEmail: string | null = null;
  if (authorId) {
    const { data: seller } = await supabase
      .from("users")
      .select("email")
      .eq("id", authorId)
      .single();
    sellerEmail = seller?.email ?? null;
  }

  const downloadUrl = `${appUrl}/assets/${firstSlug}`;
  const amountFormatted = (amountTotal / 100).toFixed(2);
  const summaryTitle =
    assetTitles.length > 1
      ? `${assetTitles.length} assets`
      : assetTitles[0] ?? "Game Asset";

  if (buyer?.email && resend) {
    await resend.emails
      .send({
        from: fromEmail,
        to: buyer.email,
        subject: "Your purchase is ready!",
        html: `
        <p>Thank you for your purchase.</p>
        <p><strong>${escapeHtml(summaryTitle)}</strong> is ready to download.</p>
        <p><a href="${downloadUrl}" style="display:inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Download</a></p>
      `,
      })
      .catch((err) => console.error("[webhook] Resend (buyer):", err));
  }

  if (sellerEmail && resend) {
    await resend.emails
      .send({
        from: fromEmail,
        to: sellerEmail,
        subject: "You made a sale!",
        html: `
        <p>Someone purchased your asset.</p>
        <p><strong>${escapeHtml(summaryTitle)}</strong> — $${amountFormatted}</p>
      `,
      })
      .catch((err) => console.error("[webhook] Resend (seller):", err));
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handlePaymentIntentPaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.error("[webhook] payment_intent.payment_failed:", {
    id: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message ?? "Unknown error",
  });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentPaymentFailed(paymentIntent);
      break;
    }
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await getRawBody(request);
  const result = constructWebhookEvent(rawBody, signature);

  if (!result.success) {
    console.error("[webhook] Verification failed:", result.error);
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  const event = result.event;
  handleEvent(event).catch((err) =>
    console.error("[webhook] Event handling error:", err)
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
