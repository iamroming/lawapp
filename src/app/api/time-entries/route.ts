import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { timeEntrySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const isOwnerOrPartner = ["owner", "partner", "super_admin"].includes(profile?.role || "");

  const { data, error } = isOwnerOrPartner && profile?.firm_id
    ? await supabase
        .from("time_entries")
        .select("*, case:cases(title, case_number), profiles!lawyer_id(full_name)")
        .eq("firm_id", profile.firm_id)
        .order("date", { ascending: false })
    : await supabase
        .from("time_entries")
        .select("*, case:cases(title, case_number)")
        .eq("lawyer_id", user.uuid)
        .order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch time entries:", error.message);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }

  const entries = (data || []).map((e: any) => ({
    ...e,
    case: Array.isArray(e.case) ? e.case[0] : e.case,
  }));
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const allowedRoles = ["owner", "partner", "senior_associate", "associate"];
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: "You do not have permission to create time entries" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = timeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // If case_id provided, verify it belongs to the user's firm
  if (parsed.data.case_id) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id")
      .eq("id", parsed.data.case_id)
      .eq("firm_id", profile?.firm_id || user.uuid)
      .is("deleted_at", null)
      .single();
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({ ...parsed.data, lawyer_id: user.uuid, firm_id: profile?.firm_id || null, case_id: parsed.data.case_id || null })
    .select()
    .single();
  if (error) {
    console.error("Failed to create time entry:", error.message);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "created",
    p_entity_type: "time_entry",
    p_entity_id: data.id,
    p_entity_name: data.description || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
