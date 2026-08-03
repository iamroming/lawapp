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
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowedFields = {
    full_name: body.full_name,
    email: body.email,
    phone: body.phone,
    alternate_phone: body.alternate_phone,
    address: body.address,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    id_type: body.id_type,
    id_number: body.id_number,
    company_name: body.company_name,
    gst_number: body.gst_number,
    notes: body.notes,
  };
  const filteredBody = Object.fromEntries(
    Object.entries(allowedFields).filter(([, v]) => v !== undefined)
  );

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
  const firmId = profile?.firm_id;

  const { data, error } = await supabase
    .from("clients")
    .update(filteredBody)
    .eq("id", id)
    .eq("firm_id", firmId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "updated",
    p_entity_type: "client",
    p_entity_id: data.id,
    p_entity_name: data.full_name || "item",
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

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("firm_id", firmId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "deleted",
    p_entity_type: "client",
    p_entity_id: id,
    p_entity_name: "item",
    p_details: {},
  });

  return NextResponse.json({ success: true });
}
