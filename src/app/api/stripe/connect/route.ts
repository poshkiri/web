import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectAccountLink, stripe } from "@/lib/stripe";

/**
 * POST — создать Connect-аккаунт (или ссылку для существующего) и вернуть URL онбординга.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("stripe_account_id, email")
      .eq("id", authUser.id)
      .single();

    const userEmail = profile?.email ?? authUser.email ?? "";
    const existingAccountId = profile?.stripe_account_id ?? null;

    const result = await createConnectAccountLink(
      authUser.id,
      existingAccountId,
      userEmail
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    if (!existingAccountId && result.accountId) {
      await supabase
        .from("users")
        .update({ stripe_account_id: result.accountId })
        .eq("id", authUser.id);
    }

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[stripe/connect]", err);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect link" },
      { status: 500 }
    );
  }
}

/**
 * GET — статус Connect-аккаунта: charges_enabled и доступный баланс (USD).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", authUser.id)
      .single();

    const accountId = profile?.stripe_account_id ?? null;
    if (!accountId) {
      return NextResponse.json({
        isActive: false,
        balance: 0,
        pendingBalance: 0,
      });
    }

    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(accountId),
      stripe.balance.retrieve({ stripeAccount: accountId }),
    ]);

    const isActive = account.charges_enabled === true;
    const available = balance.available?.find((b) => b.currency === "usd");
    const pending = balance.pending?.find((b) => b.currency === "usd");
    const availableCents = available?.amount ?? 0;
    const pendingCents = pending?.amount ?? 0;
    const balanceDollars = Math.round((availableCents / 100) * 100) / 100;
    const pendingDollars = Math.round((pendingCents / 100) * 100) / 100;

    return NextResponse.json({
      isActive,
      balance: balanceDollars,
      pendingBalance: pendingDollars,
    });
  } catch (err) {
    console.error("[stripe/connect] GET", err);
    return NextResponse.json(
      { error: "Failed to get Connect account status" },
      { status: 500 }
    );
  }
}
