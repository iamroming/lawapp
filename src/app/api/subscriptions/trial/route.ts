import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for existing active subscription
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id, status")
    .eq("user_id", user.uuid)
    .in("status", ["active", "trialing"])
    .limit(1)
    .single();

  if (existingSub) {
    return NextResponse.json({ error: "You already have an active subscription or trial." }, { status: 400 });
  }

  // Get the solo plan
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", "solo")
    .maybeSingle();

  // Create 14-day free trial
  const { error: dbError } = await supabase.from("user_subscriptions").insert({
    user_id: user.uuid,
    plan_id: planRow?.id || null,
    status: "trialing",
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method: "free_trial",
    amount_paid: 0,
    currency: "INR",
    auto_renew: false,
    notes: JSON.stringify({ plan_slug: "solo", type: "free_trial" }),
  });

  if (dbError) {
    console.error("Failed to create trial:", dbError);
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan: "solo",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    days: 14,
  });
}
