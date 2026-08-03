import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const cleanCode = code.toUpperCase().trim();

  // Fetch coupon
  const { data: coupon, error: couponError } = await supabase
    .from("coupon_codes")
    .select("*, plan:subscription_plans(*)")
    .eq("code", cleanCode)
    .eq("is_active", true)
    .single();

  if (couponError || !coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
  }

  // Validate
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ error: "Coupon is not yet active" }, { status: 400 });
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }
  if (coupon.max_uses !== -1 && coupon.current_uses >= coupon.max_uses) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }

  // Atomically increment usage count (only if under limit) — prevents TOCTOU race
  const { data: incremented, error: incError } = await supabase
    .from("coupon_codes")
    .update({ current_uses: coupon.current_uses + 1 })
    .eq("id", coupon.id)
    .lt("current_uses", coupon.max_uses)
    .select("id")
    .single();

  if (incError || !incremented) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }

  // Check if already used this coupon
  const { data: alreadyUsed } = await supabase
    .from("coupon_uses")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (alreadyUsed) {
    return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
  }

  const plan = Array.isArray(coupon.plan) ? coupon.plan[0] : coupon.plan;
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan for this coupon" }, { status: 400 });
  }

  // Calculate price
  let amountAfter = plan.price;
  if (coupon.discount_type === "free") {
    amountAfter = 0;
  } else if (coupon.discount_type === "percent") {
    amountAfter = plan.price * (1 - coupon.discount_value / 100);
  } else if (coupon.discount_type === "fixed") {
    amountAfter = Math.max(0, plan.price - coupon.discount_value);
  }

  // Determine expiry - for free/friend coupons, give 10 years
  const isLifetime = coupon.discount_type === "free";
  const expiresAt = isLifetime
    ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days for paid

  // Create or update subscription
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "expired", "cancelled"])
    .limit(1)
    .single();

  const subData = {
    user_id: user.id,
    plan_id: coupon.plan_id,
    status: "active",
    starts_at: new Date().toISOString(),
    expires_at: expiresAt,
    payment_method: "coupon",
    amount_paid: amountAfter,
    custom_price: amountAfter,
    override_reason: `Coupon: ${coupon.code}`,
  };

  let subResult;
  if (existing) {
    subResult = await supabase.from("user_subscriptions").update(subData).eq("id", existing.id).select().single();
  } else {
    subResult = await supabase.from("user_subscriptions").insert(subData).select().single();
  }

  if (subResult.error) {
    return NextResponse.json({ error: subResult.error.message }, { status: 500 });
  }

  // Record coupon usage
  await supabase.from("coupon_uses").insert({
    coupon_id: coupon.id,
    user_id: user.id,
    plan_subscribed: coupon.plan_id,
    amount_before: plan.price,
    amount_after: amountAfter,
  });

  // Log activity
  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "applied_coupon",
    p_entity_type: "subscription",
    p_entity_id: subResult.data.id,
    p_entity_name: `Applied coupon ${coupon.code}`,
    p_details: { coupon_code: coupon.code, plan: plan.name, amount: amountAfter },
  });

  return NextResponse.json({
    success: true,
    subscription: subResult.data,
    plan: plan.name,
    amount: amountAfter,
    is_lifetime: isLifetime,
  });
}
