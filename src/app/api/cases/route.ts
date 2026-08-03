import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { caseSchema } from "@/lib/validators";
import { checkCaseLimit } from "@/lib/subscription-limits";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.id).single();
  const firmId = profile?.firm_id;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  let query = supabase
    .from("cases")
    .select("*, client:clients(*), assigned:profiles!cases_assigned_to_fkey(full_name, email, avatar_url)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isOwner && firmId) {
    query = query.eq("firm_id", firmId);
  } else {
    query = query.or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cases = (data || []).map((c: any) => ({
    ...c,
    client: Array.isArray(c.client) ? c.client[0] : c.client,
    assigned: Array.isArray(c.assigned) ? c.assigned[0] : c.assigned,
  }));
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = caseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Subscription limit check
  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();
  const firmId = profile?.firm_id;

  const { count } = await supabase.from("cases").select("id", { count: "exact", head: true }).eq("created_by", user.id).is("deleted_at", null);
  const limitCheck = await checkCaseLimit(user.id, count || 0);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 403 });
  }

  // Verify client_id belongs to user's firm if provided
  if (parsed.data.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", parsed.data.client_id)
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found or does not belong to your firm" }, { status: 400 });
    }
  }

  const caseNumber = await supabase.rpc("generate_case_number");

  const { data, error } = await supabase
    .from("cases")
    .insert({
      ...parsed.data,
      case_number: caseNumber.data,
      created_by: user.id,
      firm_id: firmId,
      client_id: parsed.data.client_id || null,
      total_fee: parsed.data.total_fee || 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "created",
    p_entity_type: "case",
    p_entity_id: data.id,
    p_entity_name: data.title || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
