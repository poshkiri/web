import { loadStripe, Stripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a singleton Stripe.js instance for the frontend.
 * Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export type RedirectToCheckoutResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Redirects the user to the Stripe Checkout page for the given session.
 * Prefer using the session URL from the server (window.location.href = url) when
 * you already have it, to avoid loading Stripe.js.
 */
export async function redirectToCheckout(
  sessionId: string
): Promise<RedirectToCheckoutResult> {
  if (!sessionId) {
    return { success: false, error: "Session ID is required" };
  }

  try {
    const stripe = await getStripe();
    if (!stripe) {
      return {
        success: false,
        error: "Stripe failed to load (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?)",
      };
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      return {
        success: false,
        error: error.message ?? "Redirect to checkout failed",
      };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redirect to checkout failed";
    return { success: false, error: message };
  }
}
