import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import Razorpay from "razorpay";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ payments: [] });
  }

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  try {
    // Get all subscriptions for this user
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("notes")
      .eq("user_id", user.uuid)
      .eq("payment_method", "razorpay");

    const paymentIds = new Set<string>();
    for (const sub of subs || []) {
      try {
        const notes = JSON.parse(sub.notes || "{}");
        if (notes.razorpay_payment_id) {
          paymentIds.add(notes.razorpay_payment_id);
        }
        if (notes.razorpay_order_id) {
          // Fetch payments for this order
          const payments = await razorpay.orders.fetchPayments(notes.razorpay_order_id);
          for (const p of payments.items || []) {
            paymentIds.add(p.id);
          }
        }
      } catch {}
    }

    // Fetch details for each payment
    const payments = [];
    for (const pid of paymentIds) {
      try {
        const payment = await razorpay.payments.fetch(pid);
        payments.push({
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: new Date(payment.created_at * 1000).toISOString(),
          razorpay_payment_id: payment.id,
        });
      } catch {}
    }

    // Sort by date descending
    payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Failed to fetch payment history:", error);
    return NextResponse.json({ payments: [] });
  }
}
