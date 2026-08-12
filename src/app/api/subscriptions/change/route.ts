import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { PLANS, type PlanSlug, type BillingCycle } from "../route";

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

  const { data: currentSub } = await supabase
    .from("user_subscriptions")
    .select("id, status, notes")
    .eq("user_id", user.uuid)
    .in("status", ["active", "trialing"])
    .single();

  if (!currentSub) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  const currentNotes = currentSub.notes ? JSON.parse(currentSub.notes) : {};
  const currentPlanSlug = currentNotes.plan_slug as PlanSlug | undefined;
  const currentCycle = currentNotes.billing_cycle as BillingCycle | undefined;

  if (currentPlanSlug === planSlug && currentCycle === billingCycle) {
    return NextResponse.json(
      { error: "You're already on this plan" },
      { status: 400 }
    );
  }

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
  }
  const auth = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const plan = PLANS[planSlug];
  const billing = plan[billingCycle];

  if (!billing.razorpayPlanId) {
    return NextResponse.json(
      { error: "Plan not configured. Please contact support." },
      { status: 500 }
    );
  }

  try {
    const subId = currentNotes.razorpay_subscription_id;

    if (subId && currentSub.status === "active") {
      await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}`, {
        method: "PATCH",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: billing.razorpayPlanId,
          customer_notify: 1,
        }),
      });
    }

    await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        amount_paid: billing.price,
        notes: JSON.stringify({
          ...currentNotes,
          plan_slug: planSlug,
          billing_cycle: billingCycle,
        }),
      })
      .eq("id", currentSub.id);

    return NextResponse.json({
      success: true,
      plan: planSlug,
      billingCycle,
      amount: billing.price,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
