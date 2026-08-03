import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.id).single();
  const firmId = profile?.firm_id;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  let query = supabase
    .from("payments")
    .select("*, client:clients(full_name), case:cases(title)")
    .order("payment_date", { ascending: false });

  if (isOwner && firmId) {
    query = query.eq("firm_id", firmId);
  } else {
    query = query.eq("received_by", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payments = (data || []).map((p: any) => ({
    ...p,
    client: Array.isArray(p.client) ? p.client[0] : p.client,
    case: Array.isArray(p.case) ? p.case[0] : p.case,
  }));
  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();

  // Verify client belongs to firm if provided
  if (parsed.data.client_id && profile?.firm_id) {
    const { data: clientCheck } = await supabase
      .from("clients")
      .select("id")
      .eq("id", parsed.data.client_id)
      .eq("firm_id", profile.firm_id)
      .single();
    if (!clientCheck) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({ ...parsed.data, received_by: user.id, firm_id: profile?.firm_id || null, client_id: parsed.data.client_id || null, case_id: parsed.data.case_id || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "created",
    p_entity_type: "payment",
    p_entity_id: data.id,
    p_entity_name: data.payment_method || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
