import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "firebase-session";

// CSRF protection: verify Origin header for mutation requests
function verifyCsrf(request: NextRequest): boolean {
  const method = request.method;
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

function hasSessionCookie(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return !!sessionCookie;
}

export async function updateSession(request: NextRequest) {
  // CSRF check for mutation API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  const isAuthenticated = hasSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/reset-password",
    "/pricing",
    "/features",
    "/about",
    "/help",
    "/terms",
    "/privacy",
    "/client-login",
    "/subscription-required",
    "/home",
    "/onboarding",
  ];

  const publicPrefixes = [
    "/client/",
    "/calculators",
    "/bare-acts",
    "/api/auth",
    "/api/courts",
    "/blog",
  ];

  const isAuthPage = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublic = isAuthPage || isPublicPrefix;

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Root path is now the public landing page — no redirect for authenticated users

  if (isAuthenticated && isAuthPage && pathname !== "/" && pathname !== "/auth/callback" && pathname !== "/pricing" && pathname !== "/subscription-required" && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // For authenticated users on protected routes, profile/subscription checks
  // happen server-side in API routes and layouts (not in Edge middleware)
  return NextResponse.next({ request });
}
