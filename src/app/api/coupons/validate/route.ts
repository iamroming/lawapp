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

  // Check max uses
  if (coupon.max_uses !== -1 && coupon.current_uses >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" }, { status: 400 });
  }

  // Check if user already has an active subscription
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .single();

  const plan = Array.isArray(coupon.plan) ? coupon.plan[0] : coupon.plan;

  return NextResponse.json({
    valid: true,
    coupon_id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    plan_name: plan?.name || "Any plan",
    plan_id: coupon.plan_id,
    description: coupon.description,
    has_subscription: !!existingSub,
  });
}
