import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type CreateCheckoutSessionParams = {
  userId: string;
  assetId: string;
  price: number; // in cents (smallest currency unit)
  slug: string;
  assetTitle?: string;
  /** Optional: full URL to preview image for Stripe Checkout (HTTPS). */
  previewImageUrl?: string;
};

export type CreateCheckoutSessionResult =
  | { success: true; sessionId: string; url: string }
  | { success: false; error: string };

/**
 * Creates a Stripe Checkout Session for a single asset purchase.
 * Metadata (userId, assetId, slug) is stored for webhook handling.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResult> {
  const { userId, assetId, price, slug, assetTitle, previewImageUrl } = params;

  try {
    if (!userId || !assetId || price <= 0 || !slug) {
      return {
        success: false,
        error: "Missing or invalid parameters: userId, assetId, price (positive), slug",
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price),
            product_data: {
              name: assetTitle ?? "Game Asset",
              images: previewImageUrl ? [previewImageUrl] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/assets/${slug}?success=true`,
      cancel_url: `${appUrl}/assets/${slug}?canceled=true`,
      metadata: {
        user_id: userId,
        asset_id: assetId,
        asset_slug: slug,
      },
      client_reference_id: userId,
    });

    if (!session.id || !session.url) {
      return {
        success: false,
        error: "Stripe did not return session id or url",
      };
    }

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating checkout session";
    return {
      success: false,
      error: message,
    };
  }
}

export type CreateCartCheckoutSessionParams = {
  userId: string;
  items: Array<{
    assetId: string;
    price: number;
    slug: string;
    assetTitle?: string;
    previewImageUrl?: string;
  }>;
};

export type CreateCartCheckoutSessionResult =
  | { success: true; sessionId: string; url: string }
  | { success: false; error: string };

/**
 * Creates a single Stripe Checkout Session for multiple cart items.
 * Metadata: user_id, asset_ids (JSON array of asset ids) for webhook.
 */
export async function createCartCheckoutSession(
  params: CreateCartCheckoutSessionParams
): Promise<CreateCartCheckoutSessionResult> {
  const { userId, items } = params;

  try {
    if (!userId || !items?.length) {
      return {
        success: false,
        error: "Missing userId or empty items",
      };
    }

    const lineItems = items.map((item) => {
      if (!item.assetId || item.price <= 0 || !item.slug) {
        throw new Error(`Invalid cart item: ${item.assetId}`);
      }
      return {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price),
          product_data: {
            name: item.assetTitle ?? "Game Asset",
            images: item.previewImageUrl ? [item.previewImageUrl] : undefined,
          },
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${appUrl}/assets?success=true`,
      cancel_url: `${appUrl}/assets?canceled=true`,
      metadata: {
        user_id: userId,
        asset_ids: JSON.stringify(items.map((i) => i.assetId)),
      },
      client_reference_id: userId,
    });

    if (!session.id || !session.url) {
      return {
        success: false,
        error: "Stripe did not return session id or url",
      };
    }

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Unknown error creating cart checkout session";
    return {
      success: false,
      error: message,
    };
  }
}

export type CreateConnectAccountLinkResult =
  | { success: true; accountId: string; url: string }
  | { success: false; error: string };

/**
 * Creates a Stripe Connect Express account (if not existing) and returns
 * an Account Link URL for onboarding. Store accountId in users.stripe_account_id.
 */
export async function createConnectAccountLink(
  userId: string,
  existingAccountId: string | null,
  userEmail: string
): Promise<CreateConnectAccountLinkResult> {
  try {
    let accountId = existingAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: userEmail,
        metadata: { user_id: userId },
      });
      accountId = account.id;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/onboarding`,
      return_url: `${appUrl}/api/onboarding/complete`,
    });

    if (!link.url) {
      return {
        success: false,
        error: "Stripe did not return account link URL",
      };
    }

    return {
      success: true,
      accountId,
      url: link.url,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error creating Connect account link";
    return {
      success: false,
      error: message,
    };
  }
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret && process.env.NODE_ENV === "production") {
  console.warn("STRIPE_WEBHOOK_SECRET is not set; webhooks will fail in production.");
}

export type ConstructWebhookEventResult =
  | { success: true; event: Stripe.Event }
  | { success: false; error: string };

/**
 * Verifies and constructs a Stripe webhook event from raw body and signature.
 * Use the raw request body (string or Buffer), not parsed JSON.
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): ConstructWebhookEventResult {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return {
      success: false,
      error: "STRIPE_WEBHOOK_SECRET is not set",
    };
  }

  try {
    const payload = typeof body === "string" ? body : body.toString("utf8");
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return { success: true, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return {
      success: false,
      error: message,
    };
  }
}
