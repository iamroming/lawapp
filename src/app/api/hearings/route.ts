import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { hearingSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("case_id");

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;

  let query = supabase
    .from("hearings")
    .select("*, case:cases!hearings_case_id_fkey(id, case_number, title, status)")
    .is("deleted_at", null)
    .order("hearing_date", { ascending: false });

  if (caseId) {
    // Verify case belongs to user's firm
    const { data: caseCheck } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("firm_id", firmId)
      .single();
    if (!caseCheck) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    query = query.eq("case_id", caseId);
  } else if (firmId) {
    const { data: firmCases } = await supabase.from("cases").select("id").eq("firm_id", firmId);
    const caseIds = (firmCases || []).map((c) => c.id);
    if (caseIds.length > 0) {
      query = query.in("case_id", caseIds);
    } else {
      return NextResponse.json([]);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch hearings" }, { status: 500 });

  const hearings = (data || []).map((h: any) => ({
    ...h,
    case: Array.isArray(h.case) ? h.case[0] : h.case,
  }));
  return NextResponse.json(hearings);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = hearingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Verify case belongs to user's firm
  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;
  if (parsed.data.case_id) {
    const { data: caseRow } = await supabase.from("cases").select("id").eq("id", parsed.data.case_id).eq("firm_id", firmId).single();
    if (!caseRow) return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("hearings")
    .insert({ ...parsed.data, created_by: user.uuid, firm_id: firmId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Failed to create hearing" }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "created",
    p_entity_type: "hearing",
    p_entity_id: data.id,
    p_entity_name: data.title || data.court_name || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
