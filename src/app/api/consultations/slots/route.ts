import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const requestedLawyerId = searchParams.get("lawyer_id");
  const lawyerId = requestedLawyerId || user.uuid;

  // If requesting another lawyer's slots, verify they're in the same firm
  if (requestedLawyerId && requestedLawyerId !== user.uuid) {
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: lawyerProfile } = await supabase.from("profiles").select("firm_id").eq("id", requestedLawyerId).single();
    if (!lawyerProfile || lawyerProfile.firm_id !== firmId) {
      return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
    }
  }

  let query = supabase
    .from("consultation_slots")
    .select("*")
    .eq("lawyer_id", lawyerId)
    .order("day_of_week");

  if (date) {
    const dayOfWeek = new Date(date).getDay();
    query = query.eq("day_of_week", dayOfWeek);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { day_of_week, start_time, end_time, consultation_type, fee, duration_minutes } = body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({ error: "day_of_week, start_time, and end_time are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("consultation_slots")
      .insert({
        lawyer_id: user.uuid,
        day_of_week,
        start_time,
        end_time,
        consultation_type: consultation_type || "general",
        fee: fee || 0,
        duration_minutes: duration_minutes || 30,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
