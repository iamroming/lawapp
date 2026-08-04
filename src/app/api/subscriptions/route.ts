import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const PLANS = {
  free: {
    name: "Free",
    monthly: { price: 0, razorpayPlanId: "" },
    annual: { price: 0, razorpayPlanId: "" },
    max_cases: 3,
    max_users: 1,
    max_storage_mb: 100,
    max_ai_queries: 5,
  },
  solo: {
    name: "Solo",
    monthly: { price: 299, razorpayPlanId: process.env.RAZORPAY_PLAN_SOLO_MONTHLY || "" },
    annual: { price: 2999, razorpayPlanId: process.env.RAZORPAY_PLAN_SOLO_ANNUAL || "" },
    max_cases: 20,
    max_users: 1,
    max_storage_mb: 1024,
    max_ai_queries: 50,
  },
  professional: {
    name: "Professional",
    monthly: { price: 799, razorpayPlanId: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY || "" },
    annual: { price: 7999, razorpayPlanId: process.env.RAZORPAY_PLAN_PROFESSIONAL_ANNUAL || "" },
    max_cases: -1,
    max_users: 3,
    max_storage_mb: 5120,
    max_ai_queries: 200,
  },
  firm: {
    name: "Firm",
    monthly: { price: 1999, razorpayPlanId: process.env.RAZORPAY_PLAN_FIRM_MONTHLY || "" },
    annual: { price: 19999, razorpayPlanId: process.env.RAZORPAY_PLAN_FIRM_ANNUAL || "" },
    max_cases: -1,
    max_users: 10,
    max_storage_mb: 20480,
    max_ai_queries: -1,
  },
  enterprise: {
    name: "Enterprise",
    monthly: { price: 4999, razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || "" },
    annual: { price: 49999, razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE_ANNUAL || "" },
    max_cases: -1,
    max_users: -1,
    max_storage_mb: -1,
    max_ai_queries: -1,
  },
} as const;

export type PlanSlug = keyof typeof PLANS;
export type BillingCycle = "monthly" | "annual";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { planSlug, billingCycle } = body as {
    planSlug: PlanSlug;
    billingCycle: BillingCycle;
  };

  if (!planSlug || !PLANS[planSlug]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!billingCycle || !["monthly", "annual"].includes(billingCycle)) {
    return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
  }

  const plan = PLANS[planSlug];
  const billing = plan[billingCycle];
  const razorpayPlanId = billing.razorpayPlanId;

  if (!razorpayPlanId) {
    return NextResponse.json(
      { error: "Subscription not configured. Please contact support." },
      { status: 500 }
    );
  }

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || RAZORPAY_KEY_ID.includes("your_key_id")) {
    return NextResponse.json(
      { error: "Payment system not configured. Please contact support." },
      { status: 503 }
    );
  }

  try {
    const auth = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        total_count: billingCycle === "annual" ? 12 : 6,
        notes: {
          user_id: user.id,
          plan: planSlug,
          billing_cycle: billingCycle,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json();
      throw new Error(error.error?.description || "Failed to create subscription");
    }

    const subscription = await subscriptionResponse.json();

    const { error: dbError } = await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: null,
      status: "trialing",
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: "razorpay",
      amount_paid: 0,
      currency: "INR",
      auto_renew: true,
      notes: JSON.stringify({
        razorpay_subscription_id: subscription.id,
        plan_slug: planSlug,
        billing_cycle: billingCycle,
      }),
    });

    if (dbError) {
      console.error("Failed to save subscription:", dbError);
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      short_url: subscription.short_url,
      plan: planSlug,
      billingCycle,
      amount: billing.price,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
