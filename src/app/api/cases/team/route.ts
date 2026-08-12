import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get("case_id");
    if (!caseId) return NextResponse.json({ error: "case_id required" }, { status: 400 });

    // Verify case belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: caseRow } = await supabase.from("cases").select("id").eq("id", caseId).eq("firm_id", firmId).single();
    if (!caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("case_team")
      .select(`
        *,
        employee:profiles!case_team_employee_id_fkey(id, full_name, email, role)
      `)
      .eq("case_id", caseId)
      .order("is_lead", { ascending: false })
      .order("created_at");

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, employee_id, brought_by, profit_share_percentage, is_lead, notes } = body;

    if (!case_id || !employee_id) {
      return NextResponse.json({ error: "case_id and employee_id required" }, { status: 400 });
    }

    // Verify case belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: caseRow } = await supabase.from("cases").select("id").eq("id", case_id).eq("firm_id", firmId).single();
    if (!caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    // Verify employee is in the same firm
    const { data: empProfile } = await supabase.from("profiles").select("id").eq("id", employee_id).eq("firm_id", firmId).single();
    if (!empProfile) return NextResponse.json({ error: "Employee not found in your firm" }, { status: 404 });

    // Check if already added
    const { data: existing } = await supabase
      .from("case_team")
      .select("id")
      .eq("case_id", case_id)
      .eq("employee_id", employee_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Employee already in case team" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("case_team")
      .insert({
        case_id,
        employee_id,
        brought_by: brought_by || null,
        profit_share_percentage: profit_share_percentage || 0,
        is_lead: is_lead || false,
        notes: notes || null,
        added_by: user.uuid,
      })
      .select(`
        *,
        employee:profiles!case_team_employee_id_fkey(id, full_name, email, role)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, profit_share_percentage, is_lead, brought_by, notes } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Verify the case_team record's case belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: teamRecord } = await supabase
      .from("case_team")
      .select("case_id")
      .eq("id", id)
      .single();
    if (teamRecord) {
      const { data: caseRow } = await supabase.from("cases").select("id").eq("id", teamRecord.case_id).eq("firm_id", firmId).single();
      if (!caseRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (profit_share_percentage !== undefined) updateData.profit_share_percentage = profit_share_percentage;
    if (is_lead !== undefined) updateData.is_lead = is_lead;
    if (brought_by !== undefined) updateData.brought_by = brought_by;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from("case_team")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        employee:profiles!case_team_employee_id_fkey(id, full_name, email, role)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Verify the case_team record's case belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: teamRecord } = await supabase
      .from("case_team")
      .select("case_id")
      .eq("id", id)
      .single();
    if (teamRecord) {
      const { data: caseRow } = await supabase.from("cases").select("id").eq("id", teamRecord.case_id).eq("firm_id", firmId).single();
      if (!caseRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("case_team")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
