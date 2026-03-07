import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes that require an authenticated user. */
const protectedRoutes = ["/dashboard", "/admin"];

/** Auth routes that should redirect to dashboard when already signed in. */
const authRoutes = ["/login", "/signup"];

/**
 * Checks if the pathname matches any of the given route prefixes.
 *
 * @param pathname - Current path (e.g. /dashboard/settings)
 * @param prefixes - Route prefixes to match (e.g. ['/dashboard', '/admin'])
 * @returns true if pathname starts with any prefix
 */
function matchesRoute(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Next.js middleware: refreshes Supabase session, protects /dashboard and /admin,
 * and redirects authenticated users away from /login (and auth routes).
 */
export async function middleware(request: NextRequest) {
  const { response, user, role } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Redirect to /login if unauthenticated — do not leave user on /dashboard (or /admin)
  if (!user && matchesRoute(pathname, protectedRoutes)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoute(pathname, ["/admin"]) && user && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (matchesRoute(pathname, authRoutes) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
