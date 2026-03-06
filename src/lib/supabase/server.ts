import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates a Supabase client for Server Components and API routes (App Router).
 * Reads and writes auth cookies via next/headers so session is in sync with middleware.
 * Call this inside server components, route handlers, or server actions.
 *
 * @returns Promise resolving to Supabase server client
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore in Server Components (e.g. during static render)
        }
      },
    },
  });
}

/** User profile row from public.users (matches @/types User). */
export type ServerUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "buyer" | "seller" | "admin";
  bio: string | null;
  website: string | null;
  stripe_account_id: string | null;
  created_at: string;
};

/**
 * Returns the current authenticated user's profile from public.users, or null.
 * Use in Server Components and route handlers.
 */
export async function getCurrentUser(): Promise<ServerUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser?.id) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, name, avatar_url, role, bio, website, stripe_account_id, created_at")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) return null;
  return profile as ServerUser;
}

/**
 * Service role client — bypasses RLS. Use only in trusted server code (webhooks, cron).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
export function createServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}
