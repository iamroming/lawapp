import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request?: NextRequest) {
  try {
    // Allow cron secret auth OR user auth
    const authHeader = request?.headers.get("authorization");
    const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let supabase;
    let userId: string | null = null;

    if (isCronCall) {
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    } else {
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    const { data: cases } = await supabase
      .from("cases")
      .select("id, court, judge_name, next_hearing_date")
      .eq("created_by", userId)
      .is("deleted_at", null)
      .not("next_hearing_date", "is", null);

    if (!cases || cases.length === 0) {
      return NextResponse.json({ data: [], message: "No cases with upcoming hearings" });
    }

    const entries = cases.map((c) => ({
      case_id: c.id,
      user_id: userId,
      court_name: c.court || "Unknown Court",
      bench: null,
      cause_list_type: "main",
      serial_number: null,
      hearing_date: c.next_hearing_date,
      judge_name: c.judge_name,
      fetched_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("cause_list_entries")
      .upsert(entries, { onConflict: "user_id,case_id,hearing_date" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("log_activity", {
      p_user_id: userId,
      p_action: "synced",
      p_entity_type: "cause_list",
      p_entity_id: null,
      p_entity_name: `${entries.length} entries synced`,
      p_details: {},
    });

    return NextResponse.json({ data, count: data?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET for external cron triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
