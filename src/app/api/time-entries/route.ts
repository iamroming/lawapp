import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { timeEntrySchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("time_entries")
    .select("*, case:cases(title, case_number)")
    .eq("lawyer_id", user.id)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data || []).map((e: any) => ({
    ...e,
    case: Array.isArray(e.case) ? e.case[0] : e.case,
  }));
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = timeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({ ...parsed.data, lawyer_id: user.id, case_id: parsed.data.case_id || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "created",
    p_entity_type: "time_entry",
    p_entity_id: data.id,
    p_entity_name: data.description || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
