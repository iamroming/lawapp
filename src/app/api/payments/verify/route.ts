import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import { PLANS, type PlanSlug, type BillingCycle } from "@/app/api/subscriptions/route";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

const planLimits: Record<string, { max_cases: number; max_users: number; max_storage_mb: number; max_ai_queries: number }> = {
  free: { max_cases: 10, max_users: 10, max_storage_mb: 500, max_ai_queries: 10 },
  solo: { max_cases: 50, max_users: 2, max_storage_mb: 1024, max_ai_queries: 100 },
  professional: { max_cases: 150, max_users: 5, max_storage_mb: 5120, max_ai_queries: 300 },
  firm: { max_cases: 350, max_users: 20, max_storage_mb: 20480, max_ai_queries: 2000 },
  enterprise: { max_cases: -1, max_users: -1, max_storage_mb: 61440, max_ai_queries: 5000 },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planSlug, billingCycle } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  if (!planSlug || !PLANS[planSlug as PlanSlug]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!billingCycle || !["monthly", "annual"].includes(billingCycle)) {
    return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
  }

  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
  }

  // Verify signature with timing-safe comparison
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const sigBuffer = Buffer.from(expectedSignature, "hex");
  const userBuffer = Buffer.from(razorpay_signature, "hex");

  if (sigBuffer.length !== userBuffer.length || !crypto.timingSafeEqual(sigBuffer, userBuffer)) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Fetch and verify payment from Razorpay — FAIL if this errors
  let payment;
  try {
    payment = await getRazorpay().payments.fetch(razorpay_payment_id as string);
  } catch (error) {
    console.error("Payment fetch from Razorpay failed:", error);
    return NextResponse.json({ error: "Failed to verify payment with Razorpay" }, { status: 400 });
  }

  if (payment.status !== "captured") {
    return NextResponse.json({ error: "Payment not captured" }, { status: 400 });
  }

  const plan = PLANS[planSlug as PlanSlug];
  const expectedAmountPaise = plan[billingCycle as BillingCycle].price * 100;
  const actualAmount = Number(payment.amount);
  const tolerancePaise = Math.round(expectedAmountPaise * 0.5);
  if (Math.abs(actualAmount - expectedAmountPaise) > tolerancePaise) {
    return NextResponse.json({ error: "Payment amount does not match plan" }, { status: 400 });
  }

  const limits = planLimits[planSlug];
  if (!limits) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = billingCycle === "annual"
    ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.uuid)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingSub) {
    return NextResponse.json({ error: "An active subscription already exists" }, { status: 400 });
  }

  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();

  const { error: dbError } = await supabase.from("user_subscriptions").insert({
    user_id: user.uuid,
    plan_id: planRow?.id || null,
    status: "active",
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    payment_method: "razorpay",
    amount_paid: Number(payment.amount) / 100,
    currency: "INR",
    auto_renew: true,
    notes: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      plan_slug: planSlug,
      billing_cycle: billingCycle,
    }),
  });

  if (dbError) {
    console.error("Failed to save subscription:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;

  await supabase.from("subscription_limits").upsert({
    firm_id: firmId,
    max_cases: limits.max_cases,
    max_users: limits.max_users,
    max_storage_mb: limits.max_storage_mb,
    max_ai_queries: limits.max_ai_queries,
  }, { onConflict: "firm_id" });

  return NextResponse.json({
    success: true,
    plan: planSlug,
    billingCycle,
    expiresAt: expiresAt.toISOString(),
  });
}
