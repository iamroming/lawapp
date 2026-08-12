import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.uuid)
      .single();

    const isOwnerOrPartner = ["owner", "partner", "super_admin"].includes(profile?.role || "");

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    let query = supabase
      .from("collection_logs")
      .select("*")
      .order("sent_at", { ascending: false });

    // Owners/partners see all firm collection logs; others see own
    if (isOwnerOrPartner && profile?.firm_id) {
      query = query.eq("firm_id", profile.firm_id);
    } else {
      query = query.eq("user_id", user.uuid);
    }

    if (invoiceId) {
      query = query.eq("invoice_id", invoiceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch collection logs:", error.message);
      return NextResponse.json({ error: "Failed to fetch collection logs" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.uuid)
      .single();

    const readOnlyRoles = ["employee", "intern"];
    if (readOnlyRoles.includes(profile?.role || "")) {
      return NextResponse.json({ error: "You do not have permission to create collection logs" }, { status: 403 });
    }

    const body = await request.json();
    const { invoice_id, action, channel, notes } = body;

    if (!invoice_id || !action) {
      return NextResponse.json({ error: "invoice_id and action are required" }, { status: 400 });
    }

    const validActions = ["reminder", "final_notice", "legal_notice", "recovery", "note"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, firm_id")
      .eq("id", invoice_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (profile?.firm_id && invoice.firm_id !== profile.firm_id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    } else if (!profile?.firm_id && invoice.firm_id !== user.uuid) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("collection_logs")
      .insert({
        invoice_id,
        user_id: user.uuid,
        firm_id: profile?.firm_id || null,
        action,
        channel: channel || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create collection log:", error.message);
      return NextResponse.json({ error: "Failed to create collection log" }, { status: 500 });
    }

    await supabase.rpc("log_activity", {
      p_user_id: user.uuid,
      p_action: "created",
      p_entity_type: "collection_log",
      p_entity_id: data.id,
      p_entity_name: action,
      p_details: {},
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
