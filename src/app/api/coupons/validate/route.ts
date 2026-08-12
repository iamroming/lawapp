import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code, planSlug, billingCycle } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const cleanCode = code.toUpperCase().trim();

  const { data: coupon, error } = await supabase
    .from("coupon_codes")
    .select("*, plan:subscription_plans(id, name, slug)")
    .eq("code", cleanCode)
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 404 });
  }

  // Check validity dates
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ valid: false, error: "This coupon is not yet active" }, { status: 400 });
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ valid: false, error: "This coupon has expired" }, { status: 400 });
  }

  // Check total usage limit
  if (coupon.max_uses !== -1 && coupon.current_uses >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" }, { status: 400 });
  }

  // Check per-user usage limit
  if (coupon.max_per_user !== -1) {
    const { count } = await supabase
      .from("coupon_uses")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.uuid);

    if ((count || 0) >= coupon.max_per_user) {
      return NextResponse.json({ valid: false, error: "You have already used this coupon" }, { status: 400 });
    }
  }

  // Check billing cycle restriction
  if (coupon.billing_cycle && coupon.billing_cycle !== "both" && billingCycle) {
    if (coupon.billing_cycle !== billingCycle) {
      return NextResponse.json({
        valid: false,
        error: `This coupon is only valid for ${coupon.billing_cycle} billing`,
      }, { status: 400 });
    }
  }

  // Check plan restriction
  const plan = Array.isArray(coupon.plan) ? coupon.plan[0] : coupon.plan;
  if (coupon.plan_id && planSlug && plan) {
    if (plan.slug !== planSlug) {
      return NextResponse.json({
        valid: false,
        error: `This coupon is only valid for the ${plan.name} plan`,
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    valid: true,
    coupon_id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    plan_name: plan?.name || "Any plan",
    plan_id: coupon.plan_id,
    billing_cycle: coupon.billing_cycle || "both",
    description: coupon.description,
  });
}
