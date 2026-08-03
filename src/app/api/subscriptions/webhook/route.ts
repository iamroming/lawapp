import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const payload = body.payload?.subscription?.entity;

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const razorpaySubId = payload.id;
  const notes = payload.notes || {};
  const userId = notes.user_id;
  const planSlug = notes.plan_slug as PlanSlug | undefined;
  const billingCycle = notes.billing_cycle as "monthly" | "annual" | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  switch (event) {
    case "subscription.activated": {
      await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          expires_at: new Date(payload.current_end * 1000).toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "trialing");

      // BUG #15 fix: use billing cycle for amount
      if (planSlug && PLANS[planSlug]) {
        const plan = PLANS[planSlug];
        const amount = billingCycle === "annual" ? plan.annual.price : plan.monthly.price;
        await supabase.from("user_subscriptions").update({
          amount_paid: amount,
        }).eq("user_id", userId).eq("status", "active");
      }
      break;
    }

    case "subscription.charged": {
      await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          expires_at: new Date(payload.current_end * 1000).toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active");
      break;
    }

    case "subscription.cancelled": {
      await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
        })
        .eq("user_id", userId)
        .in("status", ["active", "trialing"]);
      break;
    }

    case "subscription.halted": {
      await supabase
        .from("user_subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId)
        .eq("status", "active");

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

    case "subscription.paused": {
      await supabase
        .from("user_subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId)
        .eq("status", "active");

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
      await supabase
        .from("user_subscriptions")
        .update({ status: "active" })
        .eq("user_id", userId)
        .eq("status", "past_due");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
