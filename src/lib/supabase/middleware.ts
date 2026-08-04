import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  ];

  const publicPrefixes = [
    "/client/",
    "/calculators",
    "/bare-acts",
    "/api/auth",
    "/api/courts",
  ];

  const isAuthPage = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublic = isAuthPage || isPublicPrefix;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile && profile.is_active === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_disabled");
      return NextResponse.redirect(url);
    }

    const role = profile?.role;

    if (!profile && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // After profile exists, check if user has an active subscription (skip for free plan, onboarding, settings, pricing, api, super-admin)
    if (profile && profile.is_active !== false) {
      const skipSubscriptionCheck = [
        "/onboarding",
        "/settings",
        "/pricing",
        "/api/",
        "/super-admin",
        "/admin",
        "/auth/",
      ];
      const shouldSkip = skipSubscriptionCheck.some((p) => pathname.startsWith(p));

      if (!shouldSkip && pathname !== "/dashboard") {
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .limit(1)
          .maybeSingle();

        if (!subscription) {
          const url = request.nextUrl.clone();
          url.pathname = "/pricing";
          url.searchParams.set("action", "subscribe");
          return NextResponse.redirect(url);
        }
      }
    }

    if (pathname.startsWith("/super-admin")) {
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!superAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith("/admin") && role !== "owner" && role !== "partner" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
