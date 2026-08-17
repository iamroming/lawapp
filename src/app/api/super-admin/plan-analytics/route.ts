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

// GET /api/super-admin/plan-analytics
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getAdminClient();

  // All plans
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price", { ascending: true });

  // All subscriptions
  const { data: subscriptions } = await supabase
    .from("user_subscriptions")
    .select("id, plan_id, status, amount_paid, starts_at, expires_at, created_at")
    .order("created_at", { ascending: false });

  // All payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, plan_id, status, created_at")
    .order("created_at", { ascending: false });

  // Calculate per-plan stats
  const planStats = (plans || []).map((plan) => {
    const planSubs = (subscriptions || []).filter((s) => s.plan_id === plan.id);
    const planPayments = (payments || []).filter((p) => p.plan_id === plan.id);

    const activeSubs = planSubs.filter((s) => s.status === "active").length;
    const trialingSubs = planSubs.filter((s) => s.status === "trialing").length;
    const cancelledSubs = planSubs.filter((s) => s.status === "cancelled").length;
    const totalSubs = planSubs.length;

    const totalRevenue = planPayments
      .filter((p) => p.status === "captured" || p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const mrr = activeSubs * plan.price;

    // Conversion rate (active / total)
    const conversionRate = totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(1) : "0";

    // Churn rate (cancelled / total)
    const churnRate = totalSubs > 0 ? ((cancelledSubs / totalSubs) * 100).toFixed(1) : "0";

    // Last 30 days new subs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubs = planSubs.filter((s) => new Date(s.created_at) > thirtyDaysAgo).length;

    return {
      ...plan,
      activeSubs,
      trialingSubs,
      cancelledSubs,
      totalSubs,
      totalRevenue,
      mrr,
      conversionRate,
      churnRate,
      recentSubs,
    };
  });

  // Overall stats
  const totalActive = (subscriptions || []).filter((s) => s.status === "active").length;
  const totalTrialing = (subscriptions || []).filter((s) => s.status === "trialing").length;
  const totalMRR = planStats.reduce((sum, p) => sum + p.mrr, 0);
  const totalRevenue = (payments || [])
    .filter((p) => p.status === "captured" || p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCancelled = (subscriptions || []).filter((s) => s.status === "cancelled").length;
  const totalSubs = (subscriptions || []).length;

  return NextResponse.json({
    success: true,
    planStats,
    overview: {
      totalPlans: (plans || []).length,
      activePlans: (plans || []).filter((p) => p.is_active).length,
      totalActive,
      totalTrialing,
      totalCancelled,
      totalSubs,
      totalMRR,
      totalRevenue,
      overallConversion: totalSubs > 0 ? ((totalActive / totalSubs) * 100).toFixed(1) : "0",
      overallChurn: totalSubs > 0 ? ((totalCancelled / totalSubs) * 100).toFixed(1) : "0",
    },
  });
}
