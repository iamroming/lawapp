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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.uuid)
    .single();

  // Check for active subscription
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("id, status, plan_slug, current_period_end")
    .eq("user_id", user.uuid)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    profile: profile || null,
    subscription: subscription || null,
  });
}
