import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getCaseByCNR } from "@/lib/ecourts/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { case_id, cnr_number, court_name, court_type, state, district } = body;

    if (!cnr_number || !court_name || !court_type) {
      return NextResponse.json({ error: "Missing required fields: cnr_number, court_name, court_type" }, { status: 400 });
    }

    // Validate CNR format (4 letters + 12 digits)
    const cnrRegex = /^[A-Z]{4}\d{12}$/;
    if (!cnrRegex.test(cnr_number.toUpperCase())) {
      return NextResponse.json({ error: "Invalid CNR format. Must be 4 letters + 12 digits (e.g., DLHC010001232024)" }, { status: 400 });
    }

    // Verify case belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: caseData } = await supabase
      .from("cases")
      .select("id")
      .eq("id", case_id)
      .eq("firm_id", firmId)
      .single();

    if (!caseData) {
      return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
    }

    // Check if CNR already tracked
    const { data: existing } = await supabase
      .from("ecourts_cases")
      .select("id")
      .eq("cnr_number", cnr_number.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "CNR already tracked" }, { status: 409 });
    }

    // Fetch initial case status from real eCourts API
    let caseStatus = null;
    const caseDetail = await getCaseByCNR(cnr_number.toUpperCase());
    
    if (caseDetail) {
      caseStatus = {
        status: caseDetail.caseStatus,
        last_hearing_date: caseDetail.lastHearingDate,
        next_hearing_date: caseDetail.nextHearingDate,
        case_stage: caseDetail.caseStage,
        judge_name: caseDetail.judgeName,
        listing_bench: caseDetail.listingBench,
        petitioners: caseDetail.petitioners,
        respondents: caseDetail.respondents,
      };
    }

    // Create ecourts_case record
    const { data: ecourtsCase, error } = await supabase
      .from("ecourts_cases")
      .insert({
        case_id,
        cnr_number: cnr_number.toUpperCase(),
        court_name,
        court_type,
        state,
        district,
        firm_id: profile?.firm_id || null,
        last_synced_at: caseStatus ? new Date().toISOString() : null,
        last_status: caseStatus?.status || null,
        last_hearing_date: caseStatus?.last_hearing_date || null,
        next_hearing_date: caseStatus?.next_hearing_date || null,
        case_stage: caseStatus?.case_stage || null,
        judge_name: caseStatus?.judge_name || null,
        listing_bench: caseStatus?.listing_bench || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the sync
    await supabase.from("ecourts_sync_log").insert({
      ecourts_case_id: ecourtsCase.id,
      sync_type: "status",
      status: caseStatus ? "success" : "partial",
      error_message: caseStatus ? null : "Could not fetch initial data from eCourts",
      data_after: caseStatus,
    });

    return NextResponse.json({ data: ecourtsCase, caseStatus }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    let query = supabase
      .from("ecourts_cases")
      .select("*, case:cases(id, case_number, title, status)")
      .eq("is_active", true);

    if (caseId) {
      query = query.eq("case_id", caseId);
    } else if (firmId) {
      const { data: firmCases } = await supabase.from("cases").select("id").eq("firm_id", firmId);
      const caseIds = (firmCases || []).map((c) => c.id);
      if (caseIds.length > 0) {
        query = query.in("case_id", caseIds);
      } else {
        return NextResponse.json({ data: [] });
      }
    } else {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
