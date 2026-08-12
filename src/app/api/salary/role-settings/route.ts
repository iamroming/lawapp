import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.uuid)
      .single();

    if (!profile?.firm_id) return NextResponse.json({ error: "No firm" }, { status: 400 });

    const { data, error } = await supabase
      .from("role_salary_defaults")
      .select("*")
      .eq("firm_id", profile.firm_id)
      .order("role");

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!profile?.firm_id) return NextResponse.json({ error: "No firm" }, { status: 400 });
    if (!["owner", "partner"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Settings must be an array" }, { status: 400 });
    }

    // Upsert each role setting
    for (const s of settings) {
      const { error } = await supabase
        .from("role_salary_defaults")
        .upsert({
          firm_id: profile.firm_id,
          role: s.role,
          payment_type: s.payment_type || "fixed_salary",
          monthly_salary: s.monthly_salary || 0,
          percentage_rate: s.percentage_rate || 0,
          pf_enabled: s.pf_enabled ?? false,
          esi_enabled: s.esi_enabled ?? false,
          tds_rate: s.tds_rate || 0,
        }, { onConflict: "firm_id,role" });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
