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
      .from("salary_settings")
      .select("*")
      .eq("firm_id", profile.firm_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Return defaults if no settings exist
    if (!data) {
      return NextResponse.json({
        firm_id: profile.firm_id,
        default_pf_rate: 12,
        default_esi_rate: 0.75,
        default_tds_rate: 10,
        payment_cycle: "monthly",
        payment_day: 1,
        auto_calculate: true,
      });
    }

    return NextResponse.json(data);
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
    const { default_pf_rate, default_esi_rate, default_tds_rate, payment_cycle, payment_day, auto_calculate } = body;

    const { data, error } = await supabase
      .from("salary_settings")
      .upsert({
        firm_id: profile.firm_id,
        default_pf_rate: default_pf_rate ?? 12,
        default_esi_rate: default_esi_rate ?? 0.75,
        default_tds_rate: default_tds_rate ?? 10,
        payment_cycle: payment_cycle ?? "monthly",
        payment_day: payment_day ?? 1,
        auto_calculate: auto_calculate ?? true,
      }, { onConflict: "firm_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
