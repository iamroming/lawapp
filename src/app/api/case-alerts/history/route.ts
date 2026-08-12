import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — fetch alert history for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alert_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get user's alert IDs
    const { data: userAlerts } = await supabase
      .from("case_alerts")
      .select("id")
      .eq("user_id", user.uuid);

    const alertIds = (userAlerts || []).map((a) => a.id);
    if (alertIds.length === 0) return NextResponse.json([]);

    let query = supabase
      .from("case_alert_history")
      .select(`
        *,
        case_alerts!inner(
          id,
          case_id,
          cases!inner(id, title, case_number, court_name)
        )
      `)
      .in("case_alert_id", alertIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (alertId) {
      query = query.eq("case_alert_id", alertId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
