import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  trialFunnelWelcome,
  trialFunnelDay3,
  trialFunnelDay7,
  trialFunnelDay12,
  trialFunnelDay14,
} from "@/lib/email-templates";
import {
  formatTrialWelcome,
  formatTrialDay3,
  formatTrialDay7,
  formatTrialDay12,
  formatTrialDay14,
} from "@/lib/whatsapp";

// CRON: GET /api/subscriptions/trial-funnel
// Run daily via Vercel cron: "0 9 * * *" (9 AM UTC)
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const results = {
    total: 0,
    emailsSent: 0,
    whatsappSent: 0,
    errors: [] as string[],
  };

  // Get all users with active trials
  const { data: trials, error: fetchError } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      user_id,
      plan_id,
      starts_at,
      expires_at,
      notes,
      users:user_id (
        id,
        email,
        full_name,
        phone
      )
    `)
    .eq("status", "trialing")
    .not("expires_at", "is", null);

  if (fetchError) {
    console.error("Failed to fetch trials:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!trials || trials.length === 0) {
    return NextResponse.json({ success: true, message: "No active trials found", ...results });
  }

  const now = new Date();

  for (const trial of trials) {
    try {
      const user = trial.users as any;
      if (!user?.email) continue;

      results.total++;

      const startDate = new Date(trial.starts_at);
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Parse plan slug from notes
      let planSlug = "solo";
      try {
        const notes = JSON.parse(trial.notes || "{}");
        planSlug = notes.plan_slug || "solo";
      } catch {}

      // Get user's case count for personalized messages
      const { count: casesCount } = await supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("created_by", trial.user_id);

      const caseCount = casesCount || 0;

      // Determine which stage to send
      let stage = "";
      if (daysSinceStart === 0) stage = "welcome";
      else if (daysSinceStart === 3) stage = "day3";
      else if (daysSinceStart === 7) stage = "day7";
      else if (daysSinceStart === 12) stage = "day12";
      else if (daysSinceStart === 14) stage = "day14";

      if (!stage) continue;

      // Check if we already sent this stage (use whatsapp_logs as dedup)
      const { data: alreadySent } = await supabase
        .from("whatsapp_logs")
        .select("id")
        .eq("user_id", trial.user_id)
        .eq("message_type", `trial_funnel_${stage}`)
        .limit(1);

      if (alreadySent && alreadySent.length > 0) continue;

      // Send email
      let emailTemplate;
      let whatsappMessage;

      switch (stage) {
        case "welcome":
          emailTemplate = trialFunnelWelcome(user.full_name || "Lawyer", planSlug);
          whatsappMessage = formatTrialWelcome(user.full_name || "Lawyer", planSlug);
          break;
        case "day3":
          emailTemplate = trialFunnelDay3(user.full_name || "Lawyer", planSlug, caseCount);
          whatsappMessage = formatTrialDay3(user.full_name || "Lawyer", planSlug, caseCount);
          break;
        case "day7":
          emailTemplate = trialFunnelDay7(user.full_name || "Lawyer", planSlug, caseCount);
          whatsappMessage = formatTrialDay7(user.full_name || "Lawyer", planSlug, caseCount);
          break;
        case "day12":
          emailTemplate = trialFunnelDay12(user.full_name || "Lawyer", planSlug, caseCount);
          whatsappMessage = formatTrialDay12(user.full_name || "Lawyer", planSlug, caseCount);
          break;
        case "day14":
          emailTemplate = trialFunnelDay14(user.full_name || "Lawyer", planSlug);
          whatsappMessage = formatTrialDay14(user.full_name || "Lawyer", planSlug);
          break;
      }

      if (emailTemplate) {
        const emailResult = await sendEmail(user.email, emailTemplate);
        if (emailResult.success) results.emailsSent++;
        else results.errors.push(`Email failed for ${user.email}: ${emailResult.error}`);
      }

      if (whatsappMessage && user.phone) {
        const whatsappResult = await sendWhatsAppMessage({
          to: user.phone.startsWith("whatsapp:") ? user.phone : `whatsapp:${user.phone}`,
          message: whatsappMessage,
          type: "custom",
          userId: trial.user_id,
        });
        if (whatsappResult.success) results.whatsappSent++;
        // Log even if failed (for dedup)
      }

      // Log the stage sent for dedup
      await supabase.from("whatsapp_logs").insert({
        user_id: trial.user_id,
        phone_number: user.phone || "",
        message_type: `trial_funnel_${stage}`,
        message_content: `Trial funnel ${stage} sent`,
        status: "sent",
        sent_at: now.toISOString(),
      });

    } catch (error) {
      results.errors.push(`Error for user ${trial.user_id}: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  return NextResponse.json({
    success: true,
    date: now.toISOString(),
    ...results,
  });
}

// Manual trigger: POST /api/subscriptions/trial-funnel
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow admin to manually trigger
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.data.user.id)
    .single();

  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Re-use GET logic
  const fakeRequest = new Request(request.url, {
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return GET(fakeRequest as NextRequest);
}
