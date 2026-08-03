import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.id).single();
  const firmId = profile?.firm_id;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  let query = supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");

  if (isOwner && firmId) {
    query = query.eq("firm_id", firmId);
  } else {
    query = query.eq("created_by", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.id).single();

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, created_by: user.id, firm_id: profile?.firm_id || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "created",
    p_entity_type: "client",
    p_entity_id: data.id,
    p_entity_name: data.full_name || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
