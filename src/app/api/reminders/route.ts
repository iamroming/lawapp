import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// HTML entity escape for email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { case_id, title, message, reminder_date, channels = ["in_app"], client_id } = body;

    if (!title || !reminder_date) {
      return NextResponse.json({ error: "Missing required fields: title, reminder_date" }, { status: 400 });
    }

    // If no firm_id on profile, use user id as firm_id (solo user)
    const firmId = profile.firm_id || user.uuid;

    const { data, error } = await supabase
      .from("scheduled_reminders")
      .insert({
        user_id: user.uuid,
        firm_id: firmId,
        case_id: case_id || null,
        client_id: client_id || null,
        title,
        message,
        reminder_date,
        channels,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: user.uuid,
      type: "reminder",
      title: `Reminder: ${title}`,
      message: message || `Reminder scheduled for ${new Date(reminder_date).toLocaleString("en-IN")}`,
      channels: ["in_app"],
      data: { reminder_id: data.id },
    });

    // If reminder is for now or past, attempt to send immediately
    const reminderTime = new Date(reminder_date);
    const now = new Date();
    if (reminderTime <= now) {
      const sendResults = await sendNotifications(data, channels, supabase);

      // Update status based on results
      const newStatus = sendResults.failed.length > 0 ? "partial" : "sent";
      await supabase
        .from("scheduled_reminders")
        .update({
          status: newStatus,
          sent_channels: sendResults.sent,
          failed_channels: sendResults.failed,
        })
        .eq("id", data.id);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const upcoming = searchParams.get("upcoming") === "true";

    const isOwner = ["owner", "partner", "super_admin"].includes(profile.role);

    let query = supabase
      .from("scheduled_reminders")
      .select("*, case:cases(id, case_number, title), client:clients(id, full_name, phone)");

    // Owners see all firm reminders, employees see only their own
    if (!isOwner) {
      query = query.eq("user_id", user.uuid);
    } else if (profile.firm_id) {
      query = query.eq("firm_id", profile.firm_id);
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (upcoming) {
      query = query.gte("reminder_date", new Date().toISOString());
    }

    const { data, error } = await query.order("reminder_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing reminder id" }, { status: 400 });
    }

    // Check ownership
    const { data: reminder } = await supabase
      .from("scheduled_reminders")
      .select("user_id, firm_id")
      .eq("id", id)
      .single();

    if (reminder && reminder.user_id !== user.uuid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, firm_id")
        .eq("id", user.uuid)
        .single();

      if (!["owner", "partner", "super_admin"].includes(profile?.role || "")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (profile?.firm_id && reminder.firm_id !== profile.firm_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("scheduled_reminders")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper: Send notifications via all channels
async function sendNotifications(
  reminder: ReminderRecord,
  channels: string[],
  supabase: any
): Promise<{ sent: string[]; failed: string[] }> {
  const results = { sent: [] as string[], failed: [] as string[] };

  for (const channel of channels) {
    try {
      switch (channel) {
        case "email":
          await sendEmail(reminder, supabase);
          results.sent.push(channel);
          break;
        case "sms":
          await sendSMS(reminder, supabase);
          results.sent.push(channel);
          break;
        case "whatsapp":
          await sendWhatsApp(reminder, supabase);
          results.sent.push(channel);
          break;
        case "in_app":
          // In-app is already handled by notification insert
          results.sent.push(channel);
          break;
        case "push":
          // Push notifications handled separately
          results.sent.push(channel);
          break;
        default:
          results.sent.push(channel);
      }
    } catch (error) {
      console.error(`Failed to send ${channel}:`, error);
      results.failed.push(channel);
    }
  }

  return results;
}

// Email sender using Resend
async function sendEmail(reminder: ReminderRecord, supabase: any) {
  if (!process.env.RESEND_API_KEY) return;

  // Get client email
  if (reminder.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("email, full_name")
      .eq("id", reminder.client_id)
      .single();

    if (!client?.email) return;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CaseFiles <reminders@CaseFiles.in>",
      to: client.email,
      subject: `Reminder: ${reminder.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${escapeHtml(reminder.title)}</h2>
          <p>${escapeHtml(reminder.message || "")}</p>
          <p><strong>Date:</strong> ${new Date(reminder.reminder_date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}</p>
          ${reminder.case ? `<p><strong>Case:</strong> ${escapeHtml(reminder.case.case_number || "")}</p>` : ""}
          <hr style="margin: 20px 0; border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">This is an automated reminder from CaseFiles</p>
        </div>
      `,
    });
  }
}

// SMS sender using MSG91
async function sendSMS(reminder: ReminderRecord, supabase: any) {
  if (!process.env.MSG91_API_KEY) return;

  if (reminder.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("phone, full_name")
      .eq("id", reminder.client_id)
      .single();

    if (!client?.phone) return;

    const message = `CaseFiles Reminder: ${reminder.title}\n${reminder.message || ""}\nDate: ${new Date(reminder.reminder_date).toLocaleString("en-IN")}`;

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
}

// WhatsApp sender using Interakt
async function sendWhatsApp(reminder: ReminderRecord, supabase: any) {
  if (!process.env.INTERAKT_API_KEY) return;

  if (reminder.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("phone, full_name")
      .eq("id", reminder.client_id)
      .single();

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
}
