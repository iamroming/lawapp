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
  const { data } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", user.uuid)
    .single();

  return data ? user : null;
}

// GET /api/super-admin/trial-funnel
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getAdminClient();
  const now = new Date();

  const { data: trials, error } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      notes,
      created_at,
      users:user_id (
        id,
        email,
        full_name,
        phone
      ),
      subscription_plans:plan_id (
        name,
        slug,
        price
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const enrichedTrials = (trials || []).map((trial) => {
    const startDate = new Date(trial.starts_at);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let stage = "expired";
    if (trial.status === "trialing") {
      if (daysSinceStart === 0) stage = "welcome";
      else if (daysSinceStart <= 3) stage = "day3";
      else if (daysSinceStart <= 7) stage = "day7";
      else if (daysSinceStart <= 12) stage = "day12";
      else if (daysSinceStart <= 14) stage = "day14";
    } else if (trial.status === "active") {
      stage = "converted";
    }

    return { ...trial, stage, daysSinceStart, users: trial.users, plan: trial.subscription_plans };
  });

  const { data: logs } = await supabase
    .from("whatsapp_logs")
    .select("id, user_id, message_type, status, sent_at, error_message")
    .like("message_type", "trial_funnel_%")
    .order("sent_at", { ascending: false })
    .limit(500);

  const stats = {
    totalTrials: enrichedTrials.length,
    activeTrials: enrichedTrials.filter((t) => t.status === "trialing").length,
    converted: enrichedTrials.filter((t) => t.status === "active").length,
    expired: enrichedTrials.filter((t) => t.status === "trialing" && t.daysSinceStart > 14).length,
    byStage: {
      welcome: enrichedTrials.filter((t) => t.stage === "welcome").length,
      day3: enrichedTrials.filter((t) => t.stage === "day3").length,
      day7: enrichedTrials.filter((t) => t.stage === "day7").length,
      day12: enrichedTrials.filter((t) => t.stage === "day12").length,
      day14: enrichedTrials.filter((t) => t.stage === "day14").length,
    },
    messagesSent: {
      total: logs?.length || 0,
      welcome: logs?.filter((l) => l.message_type === "trial_funnel_welcome").length || 0,
      day3: logs?.filter((l) => l.message_type === "trial_funnel_day3").length || 0,
      day7: logs?.filter((l) => l.message_type === "trial_funnel_day7").length || 0,
      day12: logs?.filter((l) => l.message_type === "trial_funnel_day12").length || 0,
      day14: logs?.filter((l) => l.message_type === "trial_funnel_day14").length || 0,
    },
    conversionRate: enrichedTrials.length > 0
      ? ((enrichedTrials.filter((t) => t.status === "active").length / enrichedTrials.length) * 100).toFixed(1)
      : "0",
  };

  return NextResponse.json({ success: true, stats, trials: enrichedTrials, recentLogs: logs || [] });
}
