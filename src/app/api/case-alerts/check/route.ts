import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getCaseByCNR } from "@/lib/ecourts/api";
import { sendWhatsAppMessage, formatCaseUpdate } from "@/lib/whatsapp";

// POST — check all active alerts for status changes
// Also supports GET for external cron triggers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Allow cron secret auth OR user auth
    const authHeader = request.headers.get("authorization");
    const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let firmId: string | null = null;

    if (!isCronCall) {
      const user = await verifySessionFromRequest(request);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
      if (!profile || !["owner", "partner"].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      firmId = profile.firm_id || user.uuid;
    }

    // Fetch all active alerts with ecourts case info
    let alertQuery = supabase
      .from("case_alerts")
      .select(`
        id,
        user_id,
        case_id,
        ecourts_case_id,
        channels,
        last_known_status,
        last_known_hearing_date,
        last_known_stage,
        cases!inner(id, title, case_number, court_name, assigned_to, created_by, client_id, firm_id),
        ecourts_cases(id, cnr_number, court_name, court_type)
      `)
      .eq("is_active", true);

    // Scope to firm when called by a user (not cron)
    if (firmId) {
      alertQuery = alertQuery.eq("cases.firm_id", firmId);
    }

    const { data: alerts, error: alertsError } = await alertQuery;

    if (alertsError) throw alertsError;
    if (!alerts?.length) {
      return NextResponse.json({ message: "No active alerts to check", checked: 0, changes: 0 });
    }

    const results = [];
    let changeCount = 0;

    for (const alert of alerts) {
      try {
        const ecourtsCase = Array.isArray(alert.ecourts_cases) ? alert.ecourts_cases[0] : alert.ecourts_cases;
        if (!ecourtsCase?.cnr_number) continue;

        // Fetch latest case data from eCourts
        const caseDetail = await getCaseByCNR(ecourtsCase.cnr_number);
        if (!caseDetail) continue;

        const changes: { type: string; oldValue: string; newValue: string; summary: string }[] = [];

        // Detect status change
        if (alert.last_known_status && caseDetail.caseStatus && alert.last_known_status !== caseDetail.caseStatus) {
          changes.push({
            type: "status",
            oldValue: alert.last_known_status,
            newValue: caseDetail.caseStatus,
            summary: `Status changed: ${alert.last_known_status} → ${caseDetail.caseStatus}`,
          });
        }

        // Detect hearing date change
        if (alert.last_known_hearing_date && caseDetail.nextHearingDate && alert.last_known_hearing_date !== caseDetail.nextHearingDate) {
          changes.push({
            type: "hearing_date",
            oldValue: alert.last_known_hearing_date,
            newValue: caseDetail.nextHearingDate,
            summary: `Hearing date changed: ${alert.last_known_hearing_date} → ${caseDetail.nextHearingDate}`,
          });
        }

        // Detect stage change
        if (alert.last_known_stage && caseDetail.caseStage && alert.last_known_stage !== caseDetail.caseStage) {
          changes.push({
            type: "stage",
            oldValue: alert.last_known_stage,
            newValue: caseDetail.caseStage,
            summary: `Stage changed: ${alert.last_known_stage} → ${caseDetail.caseStage}`,
          });
        }

        // Update the alert with latest known values
        await supabase
          .from("case_alerts")
          .update({
            last_known_status: caseDetail.caseStatus || alert.last_known_status,
            last_known_hearing_date: caseDetail.nextHearingDate || alert.last_known_hearing_date,
            last_known_stage: caseDetail.caseStage || alert.last_known_stage,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", alert.id);

        // If changes detected, create history and send notifications
        if (changes.length > 0) {
          changeCount += changes.length;
          const caseInfo = Array.isArray(alert.cases) ? alert.cases[0] : alert.cases;

          for (const change of changes) {
            // Insert history record
            await supabase.from("case_alert_history").insert({
              case_alert_id: alert.id,
              change_type: change.type,
              old_value: change.oldValue,
              new_value: change.newValue,
              change_summary: change.summary,
            });

            // Send notifications based on channels
            const channels = alert.channels || ["in_app"];

            // In-app notification
            if (channels.includes("in_app")) {
              const userId = caseInfo?.assigned_to || caseInfo?.created_by || alert.user_id;
              await supabase.from("notifications").insert({
                user_id: userId,
                type: "case_update",
                title: `Case Alert: ${caseInfo?.case_number || "Unknown"}`,
                message: change.summary,
                data: {
                  case_id: alert.case_id,
                  alert_id: alert.id,
                  change_type: change.type,
                  old_value: change.oldValue,
                  new_value: change.newValue,
                },
              });
            }

            // WhatsApp notification
            if (channels.includes("whatsapp")) {
              // Get user phone from profile
              const { data: profile } = await supabase
                .from("profiles")
                .select("phone")
                .eq("id", alert.user_id)
                .single();

              if (profile?.phone) {
                const message = formatCaseUpdate(
                  caseInfo?.case_number || "N/A",
                  caseInfo?.title || "N/A",
                  change.summary
                );
                await sendWhatsAppMessage({
                  to: profile.phone,
                  message,
                  type: "case_update",
                  caseId: alert.case_id,
                  userId: alert.user_id,
                });
              }
            }

            // Email notification
            if (channels.includes("email")) {
              const { data: emailProfile } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", alert.user_id)
                .single();

              if (emailProfile?.email && process.env.RESEND_API_KEY) {
                try {
                  const { Resend } = await import("resend");
                  const resend = new Resend(process.env.RESEND_API_KEY);

                  await resend.emails.send({
                    from: process.env.EMAIL_FROM || "CaseFiles <alerts@CaseFiles.in>",
                    to: emailProfile.email,
                    subject: `Case Alert: ${caseInfo?.case_number || "Unknown"} — ${change.type.replace(/_/g, " ")}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
                          <h1 style="margin: 0;">CaseFiles Case Alert</h1>
                        </div>
                        <div style="padding: 20px; background: #f9fafb;">
                          <h2>${change.summary}</h2>
                          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p><strong>Case:</strong> ${caseInfo?.case_number || "N/A"}</p>
                            <p><strong>Title:</strong> ${caseInfo?.title || "N/A"}</p>
                            <p><strong>Old Value:</strong> ${change.oldValue}</p>
                            <p><strong>New Value:</strong> ${change.newValue}</p>
                          </div>
                        </div>
                        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
                          <p>This is an automated alert from CaseFiles.</p>
                        </div>
                      </div>
                    `,
                  });
                } catch (emailErr) {
                  console.error("Failed to send case alert email:", emailErr);
                }
              }
            }

            // Mark as notified
            await supabase
              .from("case_alert_history")
              .update({ notified: true, notified_at: new Date().toISOString() })
              .eq("case_alert_id", alert.id)
              .eq("change_type", change.type)
              .is("notified", false);
          }

          results.push({
            alert_id: alert.id,
            case_id: alert.case_id,
            changes: changes.map((c) => c.summary),
          });
        }
      } catch (error) {
        console.error(`Failed to check alert ${alert.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Alert check completed",
      checked: alerts.length,
      changes: changeCount,
      details: results,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// GET for external cron triggers (GitHub Actions, cron-job.org, etc.)
export async function GET(request: NextRequest) {
  return POST(request);
}
