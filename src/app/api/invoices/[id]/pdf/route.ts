import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePDF, type InvoiceTemplateId } from "@/lib/invoices/templates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: profile } = await supabase.from("profiles").select("firm_id, firm_name, full_name, address, phone, email, gstin, bank_name, bank_account, bank_ifsc, upi_id, invoice_template, invoice_settings").eq("id", user.id).single();
  const firmId = profile?.firm_id;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("firm_id", firmId)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  let client = null;
  if (invoice.client_id) {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", invoice.client_id)
      .single();
    client = data;
  }

  let caseData = null;
  if (invoice.case_id) {
    const { data } = await supabase
      .from("cases")
      .select("title, case_number")
      .eq("id", invoice.case_id)
      .single();
    caseData = data;
  }

  try {
    const pdfBlob = generateInvoicePDF(invoice, client, caseData, profile, (profile?.invoice_template as InvoiceTemplateId) || "classic");
    const pdfBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
