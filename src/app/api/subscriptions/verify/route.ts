import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, plan_slug, billing_cycle } = body;

  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const crypto = await import("crypto");
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(generatedSignature, "hex"),
    Buffer.from(razorpay_signature, "hex")
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "trialing");

  if (error) {
    console.error("Failed to activate subscription:", error);
    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
