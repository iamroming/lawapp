import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PLANS, type PlanSlug } from "../route";

export async function POST(request: NextRequest) {
  // Read body as text FIRST for signature verification (BUG #14 fix)
  const bodyText = await request.text();

  // Require webhook secret (BUG #5 fix)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Verify webhook signature
  const razorpaySignature = request.headers.get("x-razorpay-signature");
  if (!razorpaySignature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(bodyText)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(razorpaySignature), Buffer.from(expectedSignature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse body after verification
  const body = JSON.parse(bodyText);
  const event = body.event;
  const eventId = body.id;
  const payload = body.payload?.subscription?.entity;

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const razorpaySubId = payload.id;
  const notes = payload.notes || {};
  const userId = notes.user_id;
  const planSlug = notes.plan_slug as PlanSlug | undefined;
  const billingCycle = notes.billing_cycle as "monthly" | "annual" | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  // Idempotency: check if subscription already matches target state (Bug #35)
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("status, plan_id, razorpay_sub_id, event_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Skip if this event was already processed
  if (existingSub?.event_id === eventId) {
    return NextResponse.json({ received: true, skipped: "duplicate event" });
  }

  switch (event) {
    case "subscription.activated": {
      // Idempotency: skip if already active with same plan (Bug #35)
      if (existingSub?.status === "active" && existingSub?.plan_id === planSlug) {
        return NextResponse.json({ received: true, skipped: "already active" });
      }

      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          plan_id: planSlug || null,
          expires_at: new Date(payload.current_end * 1000).toISOString(),
          razorpay_sub_id: razorpaySubId,
          event_id: eventId,
        })
        .eq("user_id", userId)
        .eq("status", "trialing");

      if (updateError) {
        console.error("Failed to update subscription on activated:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }

      // BUG #15 fix: use billing cycle for amount
      if (planSlug && PLANS[planSlug]) {
        const plan = PLANS[planSlug];
        const amount = billingCycle === "annual" ? plan.annual.price : plan.monthly.price;
        const { error: amountError } = await supabase.from("user_subscriptions").update({
          amount_paid: amount,
        }).eq("user_id", userId).eq("status", "active");
        if (amountError) {
          console.error("Failed to update amount_paid on activated:", amountError);
        }
      }
      break;
    }

    case "subscription.charged": {
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          expires_at: new Date(payload.current_end * 1000).toISOString(),
          event_id: eventId,
        })
        .eq("user_id", userId)
        .eq("status", "active");

      if (updateError) {
        console.error("Failed to update subscription on charged:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }
      break;
    }

    case "subscription.cancelled": {
      if (existingSub?.status === "cancelled") {
        return NextResponse.json({ received: true, skipped: "already cancelled" });
      }

      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
          event_id: eventId,
        })
        .eq("user_id", userId)
        .in("status", ["active", "trialing"]);

      if (updateError) {
        console.error("Failed to update subscription on cancelled:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }
      break;
    }

    case "subscription.halted":
    case "subscription.paused": {
      // subscription.halted and subscription.paused are identical events from Razorpay
      // (Bug #85): Both handled by the same case block to avoid code duplication.
      if (existingSub?.status === "past_due") {
        return NextResponse.json({ received: true, skipped: "already past_due" });
      }

      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ status: "past_due", event_id: eventId })
        .eq("user_id", userId)
        .eq("status", "active");

      if (updateError) {
        console.error("Failed to update subscription on halted:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }

      // Send payment failure email
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();
        if (profile?.email) {
          const { paymentFailedEmail } = await import("@/lib/email-templates");
          const { sendEmail } = await import("@/lib/email");
          const planName = planSlug ? planSlug.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Paid";
          await sendEmail(profile.email, paymentFailedEmail(profile.full_name || "User", planName));
        }
      } catch (e) {
        console.error("Failed to send payment failure email:", e);
      }
      break;
    }

    case "subscription.resumed": {
      if (existingSub?.status === "active") {
        return NextResponse.json({ received: true, skipped: "already active" });
      }

      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ status: "active", event_id: eventId })
        .eq("user_id", userId)
        .eq("status", "past_due");

      if (updateError) {
        console.error("Failed to update subscription on resumed:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
