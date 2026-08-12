import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ReminderClient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
}

interface ReminderCase {
  id: string;
  case_number?: string;
  title?: string;
}

interface ReminderRecord {
  id: string;
  title: string;
  message?: string;
  reminder_date: string;
  channels: string[];
  status: string;
  user_id: string;
  client_id?: string;
  case_id?: string;
  client?: ReminderClient;
  case?: ReminderCase;
}

// This endpoint should be called by a cron job (Vercel Cron, GitHub Actions, etc.)
// It checks for due reminders and sends notifications
// Add to vercel.json: { "crons": [{ "path": "/api/reminders/cron", "schedule": "* * * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Find reminders that are due (status=pending and date <= now)
    const { data: dueReminders, error: fetchError } = await supabase
      .from("scheduled_reminders")
      .select(`
        *,
        case:cases(id, case_number, title),
        client:clients(id, full_name, phone, email)
      `)
      .eq("status", "pending")
      .lte("reminder_date", new Date().toISOString())
      .order("reminder_date", { ascending: true })
      .limit(50); // Process max 50 reminders per run

    if (fetchError) throw fetchError;

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ processed: 0, message: "No due reminders" });
    }

    const results = [];

    for (const reminder of dueReminders) {
      try {
        const sendResults = await sendReminderNotifications(reminder);

        // Update reminder status
        const newStatus = sendResults.failed.length > 0 ? "partial" : "sent";
        await supabase
          .from("scheduled_reminders")
          .update({
            status: newStatus,
            sent_channels: sendResults.sent,
            failed_channels: sendResults.failed,
          })
          .eq("id", reminder.id);

        // Log each notification
        for (const channel of sendResults.sent) {
          await supabase.from("notification_logs").insert({
            user_id: reminder.user_id,
            reminder_id: reminder.id,
            channel,
            status: "sent",
          });
        }

        for (const channel of sendResults.failed) {
          await supabase.from("notification_logs").insert({
            user_id: reminder.user_id,
            reminder_id: reminder.id,
            channel,
            status: "failed",
            error_message: "Failed to send",
          });
        }

        results.push({ reminder_id: reminder.id, status: newStatus });
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({ reminder_id: reminder.id, status: "error" });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

async function sendReminderNotifications(
  reminder: ReminderRecord
): Promise<{ sent: string[]; failed: string[] }> {
  const results = { sent: [] as string[], failed: [] as string[] };
  const channels = reminder.channels || ["in_app"];

  for (const channel of channels) {
    try {
      switch (channel) {
        case "email":
          await sendReminderEmail(reminder);
          results.sent.push(channel);
          break;
        case "sms":
          await sendReminderSMS(reminder);
          results.sent.push(channel);
          break;
        case "whatsapp":
          await sendReminderWhatsApp(reminder);
          results.sent.push(channel);
          break;
        case "in_app":
          // In-app notification already exists
          results.sent.push(channel);
          break;
        case "push": {
          const pushSent = await sendReminderPush(reminder);
          if (pushSent) {
            results.sent.push(channel);
          } else {
            results.failed.push(channel);
          }
          break;
        }
        default:
          results.sent.push(channel);
      }
    } catch (error) {
      console.error(`Failed to send ${channel} for reminder ${reminder.id}:`, error);
      results.failed.push(channel);
    }
  }

  return results;
}

async function sendReminderEmail(reminder: ReminderRecord) {
  if (!process.env.RESEND_API_KEY) return;

  const client = reminder.client;
  if (!client?.email) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "CaseFiles <reminders@CaseFiles.in>",
    to: client.email,
    subject: `Reminder: ${reminder.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${reminder.title}</h2>
        <p>${reminder.message || ""}</p>
        <p><strong>Date:</strong> ${new Date(reminder.reminder_date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}</p>
        ${reminder.case ? `<p><strong>Case:</strong> ${reminder.case.case_number || ""} - ${reminder.case.title || ""}</p>` : ""}
        <hr style="margin: 20px 0; border: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">This is an automated reminder from CaseFiles</p>
      </div>
    `,
  });
}

async function sendReminderSMS(reminder: ReminderRecord) {
  if (!process.env.MSG91_API_KEY) return;

  const client = reminder.client;
  if (!client?.phone) return;

  const message = `CaseFiles: ${reminder.title}\n${reminder.message || ""}\nDate: ${new Date(reminder.reminder_date).toLocaleString("en-IN")}`;

  await fetch("https://api.msg91.com/api/v5/flow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: process.env.MSG91_API_KEY,
    },
    body: JSON.stringify({
      flow_id: process.env.MSG91_FLOW_ID,
      mobiles: `91${client.phone}`,
      message,
    }),
  });
}

async function sendReminderWhatsApp(reminder: ReminderRecord) {
  if (!process.env.INTERAKT_API_KEY) return;

  const client = reminder.client;
  if (!client?.phone) return;

  const message = `Hi ${client.full_name},\n\nReminder: ${reminder.title}\n${reminder.message || ""}\n\nDate: ${new Date(reminder.reminder_date).toLocaleString("en-IN")}\n\n- CaseFiles`;

  await fetch("https://api.interakt.shop/v1/public/message/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${process.env.INTERAKT_API_KEY}:${process.env.INTERAKT_TOKEN}`
      ).toString("base64")}`,
    },
    body: JSON.stringify({
      countryCode: "+91",
      phoneNumber: client.phone,
      type: "TEXT",
      message,
    }),
  });
}

async function sendReminderPush(reminder: ReminderRecord): Promise<boolean> {
  return false;
}
