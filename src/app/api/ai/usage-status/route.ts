import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkAiQueryLimit } from "@/lib/subscription-limits";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitCheck = await checkAiQueryLimit(user.uuid);

  // Get user role and firm for role-based messaging and firm-wide usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();
  const isOwnerOrPartner = ["owner", "partner"].includes(profile?.role || "");
  const firmId = profile?.firm_id;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let usageQuery = supabase
    .from("ai_usage")
    .select("query_type")
    .gte("created_at", oneDayAgo);
  if (firmId) {
    usageQuery = usageQuery.eq("firm_id", firmId);
  } else {
    usageQuery = usageQuery.eq("user_id", user.uuid);
  }
  const { data: usageRows } = await usageQuery;

  const featureCounts: Record<string, number> = {};
  for (const row of usageRows || []) {
    const type = row.query_type || "unknown";
    featureCounts[type] = (featureCounts[type] || 0) + 1;
  }

  // Next reset time (midnight UTC)
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(24, 0, 0, 0);

  return NextResponse.json({
    used: limitCheck.used,
    limit: limitCheck.limit,
    remaining: limitCheck.limit === -1 ? -1 : Math.max(0, limitCheck.limit - limitCheck.used),
    plan: limitCheck.plan,
    allowed: limitCheck.allowed,
    isOwnerOrPartner,
    features: featureCounts,
    resetsAt: nextReset.toISOString(),
  });
}
