import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifySuperAdmin(request: NextRequest) {
  const user = await verifySessionFromRequest(request);
  if (!user) return null;
  const supabase = getAdminClient();
  const { data } = await supabase.from("super_admins").select("id").eq("id", user.uuid).single();
  return data ? user : null;
}

// GET /api/super-admin/referrals
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getAdminClient();

  // Fetch all referrals
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select(`
      *,
      referrer:profiles!referrals_referrer_id_fkey(full_name, email, referral_code),
      referred:profiles!referrals_referred_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats
  const stats = {
    total: referrals?.length || 0,
    pending: referrals?.filter((r) => r.status === "pending").length || 0,
    signedUp: referrals?.filter((r) => r.status === "signed_up").length || 0,
    trialStarted: referrals?.filter((r) => r.status === "trial_started").length || 0,
    converted: referrals?.filter((r) => r.status === "converted").length || 0,
    rewarded: referrals?.filter((r) => r.status === "rewarded").length || 0,
    conversionRate: referrals?.length
      ? ((referrals.filter((r) => r.status === "converted" || r.status === "rewarded").length / referrals.length) * 100).toFixed(1)
      : "0",
  };

  // Top referrers
  const referrerMap = new Map<string, { name: string; email: string; count: number; converted: number }>();
  referrals?.forEach((r) => {
    const ref = r.referrer as any;
    if (!ref) return;
    const key = r.referrer_id;
    if (!referrerMap.has(key)) {
      referrerMap.set(key, { name: ref.full_name || "Unknown", email: ref.email, count: 0, converted: 0 });
    }
    const entry = referrerMap.get(key)!;
    entry.count++;
    if (r.status === "converted" || r.status === "rewarded") entry.converted++;
  });
  const topReferrers = Array.from(referrerMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);

  return NextResponse.json({ success: true, stats, referrals, topReferrers });
}
