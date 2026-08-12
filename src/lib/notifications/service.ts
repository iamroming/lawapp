import { createClient } from "@/lib/supabase/client";
import type { NotificationType, NotificationChannel, Notification } from "./types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const supabase = createClient();
  // Store in Supabase (convert camelCase to snake_case for DB columns)
  const dbNotification = {
    user_id: params.userId,
    type: params.type,
    title: params.title,
    title_hi: params.titleHi,
    message: params.message,
    message_hi: params.messageHi,
    channels: params.channels,
    read: false,
    data: params.data,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("notifications").insert(dbNotification);
  if (error) {
    console.error("Failed to store notification:", error);
  }

  // Send via configured channels
  const results = { sent: [] as string[], failed: [] as string[] };

  for (const channel of params.channels) {
    try {
      switch (channel) {
        case "email":
          await sendEmailNotification(params);
          results.sent.push(channel);
          break;
        case "sms":
          await sendSMSNotification(params);
          results.sent.push(channel);
          break;
        case "whatsapp":
          await sendWhatsAppNotification(params);
          results.sent.push(channel);
          break;
        case "in_app":
          // Already stored in DB
          results.sent.push(channel);
          break;
        case "push": {
          const pushResult = await sendPushNotification(params);
          if (pushResult.success) {
            results.sent.push(channel);
          } else {
            results.failed.push(channel);
          }
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to send ${channel} notification:`, err);
      results.failed.push(channel);
    }
  }
}

async function sendEmailNotification(params: SendNotificationParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  if (!params.clientEmail) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CaseFiles <notifications@CaseFiles.in>",
      to: params.clientEmail,
      subject: params.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${escapeHtml(params.title)}</h2>
          <p>${escapeHtml(params.message)}</p>
          ${params.data?.case_number ? `<p><strong>Case:</strong> ${escapeHtml(String(params.data.case_number))}</p>` : ""}
          ${params.data?.hearing_date ? `<p><strong>Date:</strong> ${escapeHtml(new Date(String(params.data.hearing_date)).toLocaleString("en-IN"))}</p>` : ""}
          <hr style="margin: 20px 0; border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">This is an automated notification from CaseFiles</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

async function sendSMSNotification(params: SendNotificationParams): Promise<void> {
  if (!process.env.MSG91_API_KEY) return;
  if (!params.clientPhone) return;

  try {
    const message = `CaseFiles: ${params.title}\n${params.message}`;

    await fetch("https://api.msg91.com/api/v5/flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_API_KEY,
      },
      body: JSON.stringify({
        flow_id: process.env.MSG91_FLOW_ID,
        mobiles: `91${params.clientPhone}`,
        message,
      }),
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

async function sendWhatsAppNotification(params: SendNotificationParams): Promise<void> {
  if (!process.env.INTERAKT_API_KEY) return;
  if (!params.clientPhone) return;

  try {
    const message = `Hi ${params.clientName || "there"},\n\n${params.title}\n${params.message}\n\n- CaseFiles`;

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
        phoneNumber: params.clientPhone,
        type: "TEXT",
        message,
      }),
    });
  } catch (error) {
    console.error("Failed to send WhatsApp:", error);
    throw error;
  }
}

async function sendPushNotification(params: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Push notifications not implemented" };
}

export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }

  return (data || []) as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Failed to count notifications:", error);
    return 0;
  }

  return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to delete notification:", error);
  }
}
