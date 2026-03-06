import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Called when Stripe redirects back after Connect onboarding.
 * Sets user role to seller and redirects to dashboard with success param.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
    }

    const { error } = await supabase
      .from("users")
      .update({ role: "seller" })
      .eq("id", user.id);

    if (error) {
      console.error("[onboarding/complete] update role", error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/dashboard?seller=1`);
  } catch (err) {
    console.error("[onboarding/complete]", err);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(baseUrl + "/dashboard");
  }
}
