import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
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
  };
  const filteredBody = Object.fromEntries(
    Object.entries(allowedFields).filter(([, v]) => v !== undefined)
  );

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
  const firmId = profile?.firm_id;

  const { data, error } = await supabase.from("cases").update(filteredBody).eq("id", id).eq("firm_id", firmId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
  const firmId = profile?.firm_id;

  const { error } = await supabase.from("cases").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("firm_id", firmId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "deleted",
    p_entity_type: "case",
    p_entity_id: id,
    p_entity_name: "item",
    p_details: {},
  });

  return NextResponse.json({ success: true });
}
