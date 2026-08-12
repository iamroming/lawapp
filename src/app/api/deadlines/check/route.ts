import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

interface DeadlineResult {
  case_id: string;
  case_number: string;
  limitation_date: string;
  days_remaining: number;
  reminder_type: string;
  created: boolean;
}

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
      const user = await verifySessionFromRequest(request);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.uuid;
    }

    let query = supabase
      .from("cases")
      .select("id, case_number, limitation_date")
      .is("deleted_at", null)
      .not("limitation_date", "is", null);

    if (!isCronCall && userId) {
      query = query.eq("created_by", userId);
    }

    const { data: cases } = await query;

    if (!cases || cases.length === 0) {
      return NextResponse.json({ data: [], message: "No cases with limitation dates" });
    }

    const today = new Date();
    const results: DeadlineResult[] = [];

    for (const c of cases) {
      if (!c.limitation_date) continue;

      const limDate = new Date(c.limitation_date);
      const diffMs = limDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining > 30 || daysRemaining < 0) continue;

      let reminderType: string;
      let message: string;

      if (daysRemaining <= 3) {
        reminderType = "emergency";
        message = `EMERGENCY: Only ${daysRemaining} days left for limitation in ${c.case_number}`;
      } else if (daysRemaining <= 7) {
        reminderType = "critical";
        message = `CRITICAL: ${daysRemaining} days left for limitation in ${c.case_number}`;
      } else if (daysRemaining <= 15) {
        reminderType = "urgent";
        message = `URGENT: ${daysRemaining} days left for limitation in ${c.case_number}`;
      } else {
        reminderType = "limitation";
        message = `Reminder: ${daysRemaining} days left for limitation in ${c.case_number}`;
      }

      const { data: existing } = await supabase
        .from("deadline_reminders")
        .select("id")
        .eq("case_id", c.id)
        .eq("reminder_type", reminderType)
        .eq("reminder_date", today.toISOString().split("T")[0])
        .single();

      if (existing) continue;

      const { error: insertError } = await supabase.from("deadline_reminders").insert({
        case_id: c.id,
        user_id: userId,
        reminder_date: today.toISOString().split("T")[0],
        reminder_type: reminderType,
        message,
      });

      results.push({
        case_id: c.id,
        case_number: c.case_number,
        limitation_date: c.limitation_date,
        days_remaining: daysRemaining,
        reminder_type: reminderType,
        created: !insertError,
      });
    }

    return NextResponse.json({ data: results, checked: cases.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET for external cron triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
