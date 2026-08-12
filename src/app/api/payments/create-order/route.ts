import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import Razorpay from "razorpay";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

const planAmounts: Record<string, Record<string, number>> = {
  solo: { monthly: 29900, annual: 299900 },
  professional: { monthly: 79900, annual: 799900 },
  firm: { monthly: 199900, annual: 1999900 },
  enterprise: { monthly: 499900, annual: 4999900 },
};

const planNames: Record<string, string> = {
  solo: "Solo",
  professional: "Professional",
  firm: "Firm",
  enterprise: "Enterprise",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planSlug, billingCycle, couponCode } = await req.json();

  if (!planSlug || !billingCycle) {
    return NextResponse.json({ error: "Missing plan or billing cycle" }, { status: 400 });
  }

  const baseAmount = planAmounts[planSlug]?.[billingCycle];
  if (!baseAmount) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let finalAmount = baseAmount;
  let discount = "";
  let couponId = null;

  // Validate and apply coupon if provided
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupon_codes")
      .select("*, plan:subscription_plans(id, name, slug)")
      .eq("code", couponCode.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (coupon) {
      const now = new Date();
      const isValid =
        (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
        (!coupon.valid_until || new Date(coupon.valid_until) >= now) &&
        (coupon.max_uses === -1 || coupon.current_uses < coupon.max_uses) &&
        (!coupon.billing_cycle || coupon.billing_cycle === "both" || coupon.billing_cycle === billingCycle);

      if (isValid) {
        // Check plan restriction
        const plan = Array.isArray(coupon.plan) ? coupon.plan[0] : coupon.plan;
        const planMatches = !coupon.plan_id || plan?.slug === planSlug;

        if (planMatches) {
          // Check per-user usage limit
          let userUsageOk = true;
          if (coupon.max_per_user !== -1) {
            const { count } = await supabase
              .from("coupon_uses")
              .select("id", { count: "exact", head: true })
              .eq("coupon_id", coupon.id)
              .eq("user_id", user.uuid);
            if ((count || 0) >= coupon.max_per_user) {
              userUsageOk = false;
            }
          }

          if (userUsageOk) {
            couponId = coupon.id;

            if (coupon.discount_type === "free") {
              finalAmount = 0;
              discount = "Free (coupon)";
            } else if (coupon.discount_type === "percent") {
              const percentOff = Math.min(100, Math.max(0, coupon.discount_value));
              finalAmount = Math.round(baseAmount * (1 - percentOff / 100));
              discount = `${percentOff}% off`;
            } else if (coupon.discount_type === "fixed") {
              finalAmount = Math.max(0, baseAmount - coupon.discount_value * 100);
              discount = `₹${coupon.discount_value} off`;
            }
          }
        }
      }
    }
  }

  // Free coupon — activate directly without Razorpay
  if (finalAmount === 0) {
    if (couponId) {
      // Atomically increment usage with optimistic lock — read the current count,
      // then update only if it hasn't changed since the read. Append .select() to
      // verify a row was actually updated (Supabase returns [] on zero-match updates).
      const { data: current, error: readErr } = await supabase
        .from("coupon_codes")
        .select("current_uses, max_uses")
        .eq("id", couponId)
        .single();

      if (readErr || !current) {
        return NextResponse.json({ error: "Coupon not found" }, { status: 400 });
      }

      if (current.max_uses !== -1 && current.current_uses >= current.max_uses) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }

      // Optimistic lock: update only if current_uses hasn't changed since read.
      // Append .select() so we can verify a row was actually updated.
      const { data: locked, error: lockErr } = await supabase
        .from("coupon_codes")
        .update({ current_uses: current.current_uses + 1 })
        .eq("id", couponId)
        .eq("current_uses", current.current_uses)
        .select("id");

      if (lockErr || !locked || locked.length === 0) {
        return NextResponse.json({ error: "Coupon usage limit reached. Please try again." }, { status: 409 });
      }

      // Record usage (upsert to prevent duplicates)
      await supabase.from("coupon_uses").upsert({
        coupon_id: couponId,
        user_id: user.uuid,
        plan_subscribed: planSlug,
        amount_before: baseAmount / 100,
        amount_after: 0,
      }, { onConflict: "coupon_id,user_id" });
    }

    // Create or update subscription
    const { data: existing } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", user.uuid)
      .in("status", ["active", "trialing", "expired", "cancelled"])
      .limit(1)
      .single();

    const subData = {
      user_id: user.uuid,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: "coupon",
      amount_paid: 0,
      notes: JSON.stringify({ plan_slug: planSlug, billing_cycle: billingCycle, coupon_code: couponCode }),
    };

    if (existing) {
      await supabase.from("user_subscriptions").update(subData).eq("id", existing.id);
    } else {
      await supabase.from("user_subscriptions").insert(subData);
    }

    return NextResponse.json({
      success: true,
      free: true,
      planName: planNames[planSlug] || planSlug,
      discount,
    });
  }

  // Paid — create Razorpay order with discounted amount
  try {
    const order = await getRazorpay().orders.create({
      amount: finalAmount,
      currency: "INR",
      receipt: `sub_${user.uuid.slice(0, 8)}_${planSlug}_${billingCycle}_${Date.now()}`,
      notes: {
        user_id: user.uuid,
        plan: planSlug,
        billing_cycle: billingCycle,
        coupon_code: couponCode || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      planName: planNames[planSlug] || planSlug,
      billingCycle,
      discount: discount || undefined,
      originalAmount: baseAmount,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
