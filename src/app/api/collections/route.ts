import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    let query = supabase
      .from("collection_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });

    if (invoiceId) {
      query = query.eq("invoice_id", invoiceId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { invoice_id, action, channel, notes } = body;

    if (!invoice_id || !action) {
      return NextResponse.json({ error: "invoice_id and action are required" }, { status: 400 });
    }

    const validActions = ["reminder", "final_notice", "legal_notice", "recovery", "note"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("collection_logs")
      .insert({
        invoice_id,
        user_id: user.id,
        action,
        channel: channel || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.rpc("log_activity", {
      p_user_id: user.id,
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
