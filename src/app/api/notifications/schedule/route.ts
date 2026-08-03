import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, formatHearingReminder } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Verify cron secret for scheduled calls
  const authHeader = request.headers.get("authorization");
  const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allow cron calls (no user) or authenticated users
  if (!user && !isCronCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 3 calls per hour
  const ip = getClientIp(request);
  const rateLimitKey = user ? `notif-schedule:${user.id}:${ip}` : `notif-schedule:cron:${ip}`;
  const { allowed } = await checkRateLimit(rateLimitKey, { windowMs: 3600000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 3 schedule calls per hour." }, { status: 429 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { data: hearings, error } = await supabase
    .from("hearings")
    .select("*, case:cases(id, case_number, title, created_by, assigned_to)")
    .eq("hearing_date", tomorrowStr)
    .eq("is_completed", false)
    .is("deleted_at", null);

  if (error || !hearings) {
    return NextResponse.json({ error: error?.message || "Failed to fetch hearings" }, { status: 500 });
  }

  let sentCount = 0;
  for (const hearing of hearings) {
    const caseData = Array.isArray(hearing.case) ? hearing.case[0] : hearing.case;
    if (!caseData) continue;

    const lawyerId = caseData.assigned_to || caseData.created_by;
    if (!lawyerId) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", lawyerId)
      .single();

    if (!profile?.phone) continue;

    const message = formatHearingReminder(
      profile.full_name,
      caseData.case_number,
      caseData.title,
      hearing.hearing_date,
      hearing.court || "Court"
    );

    await sendWhatsAppMessage({
      to: profile.phone,
      message,
      type: "hearing_reminder",
      caseId: caseData.id,
      userId: lawyerId,
    });

    await supabase.from("reminders").insert({
      user_id: lawyerId,
      case_id: caseData.id,
      title: `Hearing tomorrow: ${caseData.case_number}`,
      description: `Court: ${hearing.court || "TBD"}`,
      reminder_date: new Date().toISOString(),
      type: "hearing",
      is_sent: true,
    });

    sentCount++;
  }

  return NextResponse.json({ success: true, hearingsFound: hearings.length, remindersSent: sentCount });
}
