import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const MIN_PAYOUT_CENTS = 5000; // $50

/**
 * POST — запрос на выплату с Connect-баланса на банк продавца.
 * Проверяет минимальный баланс $50, создаёт payout, обновляет status в earnings на 'paid'.
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
      .select("stripe_account_id")
      .eq("id", authUser.id)
      .single();

    const stripeAccountId = profile?.stripe_account_id ?? null;
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe Connect account not set up" },
        { status: 400 }
      );
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    const available = balance.available?.find((b) => b.currency === "usd");
    const availableCents = available?.amount ?? 0;

    if (availableCents < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        {
          error: "Minimum payout is $50",
          available: Math.round((availableCents / 100) * 100) / 100,
        },
        { status: 400 }
      );
    }

    const payout = await stripe.payouts.create(
      {
        amount: availableCents,
        currency: "usd",
        metadata: { seller_id: authUser.id },
      },
      { stripeAccount: stripeAccountId }
    );

    const { error: updateError } = await supabase
      .from("earnings")
      .update({ status: "paid" })
      .eq("seller_id", authUser.id)
      .eq("status", "pending");

    if (updateError) {
      console.error("[stripe/payout] Failed to update earnings:", updateError);
    }

    return NextResponse.json({
      payoutId: payout.id,
      amount: Math.round((availableCents / 100) * 100) / 100,
      status: payout.status,
    });
  } catch (err) {
    console.error("[stripe/payout]", err);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    );
  }
}
