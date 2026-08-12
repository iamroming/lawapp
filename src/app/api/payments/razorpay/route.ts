import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { createOrder } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { amount, invoiceId } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    );
  }

  if (!invoiceId) {
    return NextResponse.json(
      { error: "Invoice ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const { data: invoiceCheck } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("firm_id", firmId)
      .single();

    if (!invoiceCheck) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const order = await createOrder(
      amount,
      "INR",
      `invoice_${invoiceId}_${Date.now()}`
    );

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        razorpay_order_id: order.id,
        status: "sent",
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
