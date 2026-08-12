import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/firebase/middleware";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Rate limiting on auth-sensitive routes
  if (pathname === "/api/auth/session" || pathname.startsWith("/auth/")) {
    const ip = getClientIp(request as unknown as Request);
    const { allowed } = await checkRateLimit(`auth:${ip}`, { windowMs: 60000, maxRequests: 10 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Rate limiting on payment and subscription endpoints
  if (pathname.startsWith("/api/payments/") || pathname.startsWith("/api/subscriptions/")) {
    const ip = getClientIp(request as unknown as Request);
    const { allowed } = await checkRateLimit(`payments:${ip}`, { windowMs: 60000, maxRequests: 20 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Rate limiting on login/signup POST
  if (method === "POST" && (pathname === "/api/auth/session" || pathname === "/login" || pathname === "/signup")) {
    const ip = getClientIp(request as unknown as Request);
    const { allowed } = await checkRateLimit(`login:${ip}`, { windowMs: 300000, maxRequests: 5 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again in 5 minutes." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
