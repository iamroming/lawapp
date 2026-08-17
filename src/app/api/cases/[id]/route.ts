import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;

  const { data, error } = await supabase
    .from("cases")
    .select("*, client:clients(*), assigned:profiles!cases_assigned_to_fkey(*), creator:profiles!cases_created_by_fkey(full_name)")
    .eq("id", id)
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.client = Array.isArray(data.client) ? data.client[0] : data.client;
  data.assigned = Array.isArray(data.assigned) ? data.assigned[0] : data.assigned;
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const allowedFields = {
    title: body.title,
    description: body.description,
    case_type: body.case_type,
    court: body.court,
    court_room: body.court_room,
    judge_name: body.judge_name,
    opposing_party: body.opposing_party,
    opposing_counsel: body.opposing_counsel,
    client_id: body.client_id,
    assigned_to: body.assigned_to,
    status: body.status,
    priority: body.priority,
    filing_date: body.filing_date,
    next_hearing_date: body.next_hearing_date,
    total_fee: body.total_fee,
    outcome: body.outcome,
    advance_amount: body.advance_amount,
    amount_received: body.amount_received,
  };
  const filteredBody = Object.fromEntries(
    Object.entries(allowedFields).filter(([, v]) => v !== undefined)
  );

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;
  const role = profile?.role;

  if (!["owner", "partner", "senior_associate", "associate"].includes(role || "")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  if (body.client_id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.client_id)) {
      return NextResponse.json({ error: "Invalid client_id format" }, { status: 400 });
    }
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", body.client_id)
      .eq("firm_id", firmId || "")
      .single();
    if (!client) {
      return NextResponse.json({ error: "Client not found in your firm" }, { status: 404 });
    }
  }

  const { data, error } = await supabase.from("cases").update(filteredBody).eq("id", id).eq("firm_id", firmId).select().single();
  if (error) {
    console.error("Failed to update case:", error.message);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "updated",
    p_entity_type: "case",
    p_entity_id: data.id,
    p_entity_name: data.title || "item",
    p_details: {},
  });

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;
  const role = profile?.role;

  if (!["owner", "partner", "senior_associate"].includes(role || "")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error } = await supabase.from("cases").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("firm_id", firmId);
  if (error) {
    console.error("Failed to delete case:", error.message);
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "deleted",
    p_entity_type: "case",
    p_entity_id: id,
    p_entity_name: "item",
    p_details: {},
  });

  return NextResponse.json({ success: true });
}
