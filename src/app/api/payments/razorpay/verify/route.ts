import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } =
    body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing payment verification fields" },
      { status: 400 }
    );
  }

  try {
    const isValid = await verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
    const firmId = profile?.firm_id;

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
        payment_method: "card",
        razorpay_payment_id,
      })
      .eq("id", invoiceId)
      .eq("firm_id", firmId);

    if (invoiceError) {
      console.error("Failed to update invoice:", invoiceError);
      return NextResponse.json(
        { error: "Failed to update invoice status" },
        { status: 500 }
      );
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("client_id, case_id, amount")
      .eq("id", invoiceId)
      .single();

    if (invoice) {
      await supabase.from("payments").insert({
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        case_id: invoice.case_id,
        amount: invoice.amount,
        payment_method: "card",
        payment_date: new Date().toISOString(),
        reference_number: razorpay_payment_id,
        received_by: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
