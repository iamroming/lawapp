import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { calculateGST, calculateTDS, getCurrentFinancialYear, getCurrentQuarter } from "@/lib/india/billing";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, state, role")
      .eq("id", user.uuid)
      .single();

    const allowedRoles = ["owner", "partner", "senior_associate", "super_admin"];
    if (!allowedRoles.includes(profile?.role || "")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions to create invoices" }, { status: 403 });
    }

    const body = await request.json();
    const {
      case_id,
      client_id,
      amount,
      description,
      gst_rate = 18,
      client_state,
      lawyer_state,
      client_type = "individual",
      pan_number,
      hsn_code = "9982",
      due_date,
      billing_type = "fixed", // fixed, hourly, appearance, retainer
    } = body;

    if (!client_id || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Invalid client_id or amount" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a valid positive number" }, { status: 400 });
    }

    if (client_id && typeof client_id !== "string") {
      return NextResponse.json({ error: "client_id must be a string" }, { status: 400 });
    }

    // Get client details and verify firm ownership
    const { data: client } = await supabase
      .from("clients")
      .select("id, full_name, state, gst_number, firm_id")
      .eq("id", client_id)
      .eq("firm_id", profile?.firm_id || "")
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (profile?.firm_id && client.firm_id !== profile.firm_id) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (case_id) {
      const { data: caseRecord } = await supabase
        .from("cases")
        .select("id")
        .eq("id", case_id)
        .eq("firm_id", profile?.firm_id || "")
        .single();
      if (!caseRecord) {
        return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
      }
    }

    const supplyState = client_state || client.state || "DL";
    const receiverState = lawyer_state || profile?.state || "DL";

    // Calculate GST
    const gst = calculateGST(parsedAmount, supplyState, receiverState, gst_rate);

    // Calculate TDS
    const tds = calculateTDS(parsedAmount, client_type as "individual" | "company" | "government", !!pan_number);

    // Generate invoice number using atomic RPC to prevent race condition
    const fy = getCurrentFinancialYear();
    let invoiceNumber: string;

    const { data: nextNum, error: numError } = await supabase
      .rpc("next_invoice_number", { p_firm_id: profile?.firm_id || "", p_fy: fy });

    if (numError || !nextNum) {
      // Fallback: use timestamp-based number
      invoiceNumber = `INV/${fy}/${Date.now().toString().slice(-4)}`;
    } else {
      invoiceNumber = `INV/${fy}/${String(nextNum).padStart(4, "0")}`;
    }

    // Create invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        case_id,
        client_id,
        issued_by: user.uuid,
        firm_id: profile?.firm_id || null,
        amount: parsedAmount,
        tax_amount: gst.totalTax,
        gst_rate,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        gstin: client.gst_number,
        hsncode: hsn_code,
        place_of_supply: supplyState,
        reverse_charge: false,
        description,
        status: "draft",
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        billing_type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("log_activity", {
      p_user_id: user.uuid,
      p_action: "created",
      p_entity_type: "invoice",
      p_entity_id: invoice.id,
      p_entity_name: invoice.invoice_number || "item",
      p_details: {},
    });

    // Create TDS record if applicable
    if (tds.tdsAmount > 0 && pan_number) {
      await supabase.from("tds_records").insert({
        invoice_id: invoice.id,
        client_id,
        tds_rate: tds.tdsRate,
        tds_amount: tds.tdsAmount,
        pan_number,
        quarter: getCurrentQuarter(),
        financial_year: fy,
      });
    }

    // Update case total fee
    if (case_id) {
      await supabase.rpc("increment_case_fee", {
        p_case_id: case_id,
        p_amount: gst.totalAmount,
      });
    }

    return NextResponse.json({
      data: {
        ...invoice,
        gst_calculation: gst,
        tds_calculation: tds,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;
    const isOwner = ["owner", "partner", "super_admin"].includes(profile?.role || "");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");
    const upcoming = searchParams.get("upcoming") === "true";

    let query = supabase
      .from("invoices")
      .select("*, client:clients(id, full_name, phone, email), case:cases(id, case_number, title)");

    if (isOwner && firmId) {
      query = query.eq("firm_id", firmId);
    } else {
      query = query.eq("issued_by", user.uuid);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (upcoming) {
      query = query.gte("due_date", new Date().toISOString().split("T")[0]);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate aging for each invoice
    const invoicesWithAging = (data || []).map((inv) => {
      if (inv.status !== "paid" && inv.due_date) {
        const due = new Date(inv.due_date);
        const now = new Date();
        const daysOverdue = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
        return { ...inv, days_overdue: daysOverdue };
      }
      return { ...inv, days_overdue: 0 };
    });

    // Summary stats
    const totalPending = invoicesWithAging
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);

    const totalPaid = invoicesWithAging
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);

    const totalOverdue = invoicesWithAging
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);

    return NextResponse.json({
      data: invoicesWithAging,
      summary: {
        total_pending: totalPending,
        total_paid: totalPaid,
        total_overdue: totalOverdue,
        invoice_count: invoicesWithAging.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
