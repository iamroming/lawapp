import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Rate limiting on auth-sensitive routes
  if (pathname === "/api/auth/callback" || pathname.startsWith("/auth/")) {
    const ip = getClientIp(request as unknown as Request);
    const { allowed } = await checkRateLimit(`auth:${ip}`, { windowMs: 60000, maxRequests: 10 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Rate limiting on login/signup POST
  if (method === "POST" && (pathname === "/api/auth/callback" || pathname === "/login" || pathname === "/signup")) {
    const ip = getClientIp(request as unknown as Request);
    const { allowed } = await checkRateLimit(`login:${ip}`, { windowMs: 300000, maxRequests: 5 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again in 5 minutes." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // CSRF protection on all state-changing API routes
  if (["POST", "PUT", "DELETE"].includes(method) && pathname.startsWith("/api/")) {
    // Skip CSRF for webhook (uses Razorpay signature) and auth endpoints
    const skipCsrf = [
      "/api/subscriptions/webhook",
      "/api/auth/signup",
      "/api/auth/callback",
      "/api/team/redeem-code",
    ];
    const shouldSkip = skipCsrf.some((p) => pathname.startsWith(p));

    if (!shouldSkip) {
      const csrfCookie = request.cookies.get("csrf_token")?.value;
      const csrfHeader = request.headers.get("x-csrf-token");
      if (!csrfCookie || !csrfHeader || !validateCsrfToken(csrfCookie) || csrfCookie !== csrfHeader) {
        return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
