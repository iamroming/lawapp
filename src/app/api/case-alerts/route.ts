import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — list all alerts for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    let query = supabase
      .from("case_alerts")
      .select("*, cases(id, title, case_number, court_name, status)")
      .eq("user_id", user.uuid)
      .order("created_at", { ascending: false });

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// POST — create or toggle alert for a case
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, channels } = body;

    if (!case_id) return NextResponse.json({ error: "case_id is required" }, { status: 400 });

    // Verify the case exists and belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id, title, case_number, court_name, status, firm_id")
      .eq("id", case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (firmId && caseData.firm_id !== firmId) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Check if alert already exists
    const { data: existing } = await supabase
      .from("case_alerts")
      .select("id, is_active")
      .eq("user_id", user.uuid)
      .eq("case_id", case_id)
      .single();

    if (existing) {
      // Toggle active state
      const { data, error } = await supabase
        .from("case_alerts")
        .update({
          is_active: !existing.is_active,
          channels: channels || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Find linked ecourts_case if any
    const { data: ecourtsCase } = await supabase
      .from("ecourts_cases")
      .select("id")
      .eq("case_id", case_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    // Create new alert
    const { data, error } = await supabase
      .from("case_alerts")
      .insert({
        user_id: user.uuid,
        case_id,
        ecourts_case_id: ecourtsCase?.id || null,
        channels: channels || ["in_app", "email", "whatsapp"],
        last_known_status: caseData.status,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// DELETE — remove an alert
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");
    const caseId = searchParams.get("case_id");

    if (!alertId && !caseId) {
      return NextResponse.json({ error: "id or case_id is required" }, { status: 400 });
    }

    let query = supabase.from("case_alerts").delete().eq("user_id", user.uuid);

    if (alertId) {
      query = query.eq("id", alertId);
    } else if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
