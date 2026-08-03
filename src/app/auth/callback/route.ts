import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`auth:${ip}`, { windowMs: 60000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=rate_limit`);
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      let redirectUrl = `${origin}${next}`;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, firm_id")
          .eq("id", user.id)
          .single();

        if (!profile || (!profile.firm_id && profile.role !== "super_admin")) {
          redirectUrl = `${origin}/onboarding`;
        }
      }

      const redirectResponse = NextResponse.redirect(redirectUrl);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirectResponse.cookies.set(name, value, options)
      );
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
