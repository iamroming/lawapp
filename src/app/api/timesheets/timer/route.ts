import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — get active timer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("active_timers")
      .select("*, cases(id, title, case_number)")
      .eq("user_id", user.uuid)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return NextResponse.json(data || null);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// POST — start timer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Stop any existing timer first
    await supabase.from("active_timers").delete().eq("user_id", user.uuid);

    const body = await request.json();
    const { case_id, description } = body;

    const { data, error } = await supabase
      .from("active_timers")
      .insert({
        user_id: user.uuid,
        case_id: case_id || null,
        description: description || null,
        started_at: new Date().toISOString(),
      })
      .select("*, cases(id, title, case_number)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// PATCH — stop timer and create timesheet entry
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get active timer
    const { data: timer } = await supabase
      .from("active_timers")
      .select("*")
      .eq("user_id", user.uuid)
      .single();

    if (!timer) return NextResponse.json({ error: "No active timer" }, { status: 400 });

    // Calculate hours
    const startedAt = new Date(timer.started_at);
    const hours = Math.round(((Date.now() - startedAt.getTime()) / 3600000) * 100) / 100;
    if (hours <= 0) return NextResponse.json({ error: "Timer too short" }, { status: 400 });

    // Get user's firm_id
    const { data: profile } = await supabase
      .from("profiles").select("firm_id").eq("id", user.uuid).single();

    // Create timesheet entry
    const { data: timesheet, error: tsError } = await supabase
      .from("timesheets")
      .insert({
        user_id: user.uuid,
        case_id: timer.case_id,
        firm_id: profile?.firm_id || null,
        description: timer.description,
        hours,
        worked_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (tsError) throw tsError;

    // Delete the timer
    await supabase.from("active_timers").delete().eq("user_id", user.uuid);

    return NextResponse.json(timesheet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// DELETE — cancel timer without saving
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await supabase.from("active_timers").delete().eq("user_id", user.uuid);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
