import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { sendWhatsAppMessage, formatHearingReminder, formatOwnerHearingReminder } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Verify cron secret for scheduled calls
  const authHeader = request.headers.get("authorization");
  const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  const supabase = await createClient();
  const user = isCronCall ? null : await verifySessionFromRequest(request);

  // Allow cron calls (no user) or authenticated users
  if (!user && !isCronCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 3 calls per hour
  const ip = getClientIp(request);
  const rateLimitKey = user ? `notif-schedule:${user.uuid}:${ip}` : `notif-schedule:cron:${ip}`;
  const { allowed } = await checkRateLimit(rateLimitKey, { windowMs: 3600000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 3 schedule calls per hour." }, { status: 429 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Get firm_id for non-cron calls
  let firmId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.uuid)
      .single();
    firmId = profile?.firm_id || user.uuid;
  }

  let hearingQuery = supabase
    .from("hearings")
    .select("*, case:cases!inner(id, case_number, title, created_by, assigned_to, firm_id)")
    .eq("hearing_date", tomorrowStr)
    .eq("is_completed", false)
    .is("deleted_at", null);

  // Scope to firm for non-cron calls
  if (firmId) {
    hearingQuery = hearingQuery.eq("case.firm_id", firmId);
  }

  const { data: hearings, error } = await hearingQuery;

  if (error || !hearings) {
    return NextResponse.json({ error: error?.message || "Failed to fetch hearings" }, { status: 500 });
  }

  let sentCount = 0;
  const notifiedOwnerIds = new Set<string>();

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

    // Send to assigned lawyer
    if (profile?.phone) {
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

    // Send to firm owner (once per owner across all hearings)
    const hearingFirmId = caseData.firm_id;
    if (hearingFirmId && !notifiedOwnerIds.has(hearingFirmId)) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("firm_id", hearingFirmId)
        .eq("role", "owner")
        .maybeSingle();

      if (owner?.phone && owner.id !== lawyerId) {
        const ownerMessage = formatOwnerHearingReminder(
          owner.full_name,
          profile?.full_name || "Team member",
          caseData.case_number,
          caseData.title,
          hearing.hearing_date,
          hearing.court || "Court"
        );

        await sendWhatsAppMessage({
          to: owner.phone,
          message: ownerMessage,
          type: "hearing_reminder",
          caseId: caseData.id,
          userId: owner.id,
        });

        notifiedOwnerIds.add(hearingFirmId);
      }
    }
  }

  return NextResponse.json({ success: true, hearingsFound: hearings.length, remindersSent: sentCount });
}
