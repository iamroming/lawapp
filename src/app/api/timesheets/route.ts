import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — list timesheets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const caseId = searchParams.get("case_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { data: profile } = await supabase
      .from("profiles").select("firm_id, role").eq("id", user.uuid).single();

    let query = supabase
      .from("timesheets")
      .select("*, cases(id, title, case_number)")
      .order("worked_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (profile?.firm_id && ["owner", "partner"].includes(profile.role || "")) {
      query = query.eq("firm_id", profile.firm_id);
    } else {
      query = query.eq("user_id", user.uuid);
    }

    if (startDate) query = query.gte("worked_date", startDate);
    if (endDate) query = query.lte("worked_date", endDate);
    if (caseId) query = query.eq("case_id", caseId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// POST — create a timesheet entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, description, hours, billable_rate, is_billable, worked_date } = body;

    if (!hours || hours <= 0) return NextResponse.json({ error: "Hours must be > 0" }, { status: 400 });

    const { data: profile } = await supabase
      .from("profiles").select("firm_id").eq("id", user.uuid).single();

    const { data, error } = await supabase
      .from("timesheets")
      .insert({
        user_id: user.uuid,
        case_id: case_id || null,
        firm_id: profile?.firm_id || null,
        description: description || null,
        hours,
        billable_rate: billable_rate || 0,
        is_billable: is_billable !== false,
        worked_date: worked_date || new Date().toISOString().split("T")[0],
      })
      .select("*, cases(id, title, case_number)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const { error } = await supabase.from("timesheets").delete().eq("id", id).eq("firm_id", firmId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
