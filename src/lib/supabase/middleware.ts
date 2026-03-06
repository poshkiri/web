import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase auth session in the middleware and writes updated
 * cookies to the response. Must run on every request so tokens stay valid.
 * Also returns the current user and their role from public.users so route
 * protection (e.g. admin-only) can use it without a second client.
 * If Supabase URL/Key are not set, returns next() with user: null so the app still runs.
 *
 * @param request - Incoming Next.js request (cookies read from here)
 * @returns Object with NextResponse (with refreshed session cookies), current user or null, and role or null
 */
export async function updateSession(
  request: NextRequest
): Promise<{
  response: NextResponse;
  user: User | null;
  role: "buyer" | "seller" | "admin" | null;
}> {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, user: null, role: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "buyer" | "seller" | "admin" | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "buyer" || profile?.role === "seller" || profile?.role === "admin") {
      role = profile.role;
    }
  }

  return { response, user, role };
}
