import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  let user = await verifySessionFromRequest(request);

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { getAdminAuth } = await import("@/lib/firebase/admin");
        const auth = await getAdminAuth();
        const decoded = await auth.verifyIdToken(authHeader.slice(7));
        const { firebaseUidToUuid } = await import("@/lib/firebase/uid");
        user = {
          uid: decoded.uid,
          uuid: firebaseUidToUuid(decoded.uid),
          email: decoded.email ?? null,
          displayName: decoded.name ?? null,
        };
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active, firm_id")
    .eq("id", user.uuid)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Failed to fetch profile", details: profileError.message },
      { status: 500 }
    );
  }

  // Check super admin status
  let is_super_admin = false;
  if (profile) {
    const { data: sa } = await supabase
      .from("super_admins")
      .select("id")
      .eq("id", user.uuid)
      .maybeSingle();
    is_super_admin = !!sa || profile.role === "super_admin";
  }

  // Super admins bypass subscription check
  if (is_super_admin) {
    return NextResponse.json({
      profile: profile ? { role: profile.role, is_active: profile.is_active } : null,
      subscription: { id: "super-admin", status: "active", plan_slug: "super-admin", current_period_end: null },
      is_super_admin: true,
    });
  }

  // Check for active subscription
  let subscription = null;

  if (profile?.role === "owner" || profile?.role === "partner") {
    // Owners/partners: check their own subscription
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("id, status, expires_at, notes")
      .eq("user_id", user.uuid)
      .in("status", ["active", "trialing", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = sub;
  }

  // For employees or if owner/partner has no subscription, check via firm_id
  if (!subscription && profile?.firm_id) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("firm_id", profile.firm_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (owner) {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("id, status, expires_at, notes")
        .eq("user_id", owner.id)
        .in("status", ["active", "trialing", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      subscription = sub;
    }
  }

  // Final fallback: check the user's own subscription regardless of role
  if (!subscription) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("id, status, expires_at, notes")
      .eq("user_id", user.uuid)
      .in("status", ["active", "trialing", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = sub;
  }

  return NextResponse.json({
    profile: profile ? { role: profile.role, is_active: profile.is_active } : null,
    subscription: subscription || null,
    is_super_admin: false,
  });
}
