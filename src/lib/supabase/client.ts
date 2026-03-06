import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Placeholder used when env vars are missing so the app still runs (requests will fail until .env.local is set). */
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Creates a Supabase client for use in Client Components (browser).
 * Uses PKCE flow, auto-refresh and session persistence via cookies.
 * Prefer this over createServerClient in any 'use client' component.
 * If NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are not set, returns a client that will fail on requests — set .env.local to fix.
 *
 * @returns Supabase browser client (singleton in browser)
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createClient() {
  return createBrowserClient(
    isConfigured ? supabaseUrl! : "https://placeholder.supabase.co",
    isConfigured ? supabaseAnonKey! : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
  );
}
