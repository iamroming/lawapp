import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export const PLANS = {
  solo: {
    name: "Solo",
    monthly: { price: 299, razorpayPlanId: process.env.RAZORPAY_PLAN_SOLO_MONTHLY || "" },
    annual: { price: 2999, razorpayPlanId: process.env.RAZORPAY_PLAN_SOLO_ANNUAL || "" },
    max_cases: 20,
    max_users: 1,
    max_storage_mb: 1024,
    max_ai_queries: 50,
    max_branches: 0,
  },
  professional: {
    name: "Professional",
    monthly: { price: 799, razorpayPlanId: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY || "" },
    annual: { price: 7999, razorpayPlanId: process.env.RAZORPAY_PLAN_PROFESSIONAL_ANNUAL || "" },
    max_cases: 50,
    max_users: 3,
    max_storage_mb: 3072,
    max_ai_queries: 200,
    max_branches: 0,
  },
  firm: {
    name: "Firm",
    monthly: { price: 1999, razorpayPlanId: process.env.RAZORPAY_PLAN_FIRM_MONTHLY || "" },
    annual: { price: 19999, razorpayPlanId: process.env.RAZORPAY_PLAN_FIRM_ANNUAL || "" },
    max_cases: 100,
    max_users: 10,
    max_storage_mb: 7168,
    max_ai_queries: -1,
    max_branches: 3,
  },
  enterprise: {
    name: "Enterprise",
    monthly: { price: 4999, razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || "" },
    annual: { price: 49999, razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE_ANNUAL || "" },
    max_cases: 500,
    max_users: 50,
    max_storage_mb: 20480,
    max_ai_queries: 150,
    max_branches: 10,
  },
} as const;

export type PlanSlug = keyof typeof PLANS;
export type BillingCycle = "monthly" | "annual";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();

  let query = supabase
    .from("user_subscriptions")
    .select("*, plan:subscription_plans(name, price)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (profile?.firm_id) {
    const { data: owner } = await supabase
      .from("firm_members")
      .select("user_id")
      .eq("firm_id", profile.firm_id)
      .eq("role", "owner")
      .limit(1)
      .single();
    query = query.eq("user_id", owner?.user_id || user.uuid);
  } else {
    query = query.eq("user_id", user.uuid);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
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

  // Check for existing active subscription
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id, status")
    .eq("user_id", user.uuid)
    .in("status", ["active", "trialing"])
    .limit(1)
    .single();

  if (existingSub) {
    return NextResponse.json({ error: "You already have an active subscription. Please cancel it first." }, { status: 400 });
  }

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
        total_count: 1,
        notes: {
          user_id: user.uuid,
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

    const { data: planRow } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("slug", planSlug)
      .maybeSingle();

    const { error: dbError } = await supabase.from("user_subscriptions").insert({
      user_id: user.uuid,
      plan_id: planRow?.id || null,
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
