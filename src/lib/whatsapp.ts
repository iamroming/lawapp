import { createClient } from "./supabase/server";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: "hearing_reminder" | "case_update" | "payment_reminder" | "document_share" | "custom";
  caseId?: string;
  clientId?: string;
  userId?: string;
}

export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("WhatsApp not configured - logging message instead");
    await logWhatsAppMessage(msg, "sent", undefined, undefined);
    return { success: false, sid: undefined, error: "Twilio not configured" };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: msg.to,
          From: TWILIO_WHATSAPP_FROM,
          Body: msg.message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      await logWhatsAppMessage(msg, "failed", undefined, data.message);
      return { success: false, error: data.message };
    }

    await logWhatsAppMessage(msg, "sent", data.sid, undefined);
    return { success: true, sid: data.sid };
  } catch (error) {
    await logWhatsAppMessage(msg, "failed", undefined, error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function logWhatsAppMessage(
  msg: WhatsAppMessage,
  status: "pending" | "sent" | "delivered" | "failed",
  twilioSid?: string,
  errorMessage?: string
) {
  try {
    const supabase = await createClient();
    await supabase.from("whatsapp_logs").insert({
      user_id: msg.userId,
      client_id: msg.clientId,
      case_id: msg.caseId,
      phone_number: msg.to,
      message_type: msg.type,
      message_content: msg.message,
      status,
      twilio_sid: twilioSid,
      error_message: errorMessage,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Failed to log WhatsApp message:", error);
  }
}

export function formatHearingReminder(lawyerName: string, caseNumber: string, caseTitle: string, hearingDate: string, court: string): string {
  return `⚖️ *Hearing Reminder*

Dear ${lawyerName},

This is a reminder that your case:
📋 *${caseNumber}* - ${caseTitle}

📅 is scheduled for: *${hearingDate}*
🏛️ at: *${court}*

Please ensure all documents are prepared.

_This is an automated reminder from CaseFiles_`;
}

export function formatCaseUpdate(caseNumber: string, caseTitle: string, update: string): string {
  return `📋 *Case Update*

Case: *${caseNumber}* - ${caseTitle}

📝 Update: ${update}

_This is an automated update from CaseFiles_`;
}

export function formatPaymentReminder(clientName: string, amount: number, invoiceNumber: string, dueDate: string): string {
  return `💰 *Payment Reminder*

Dear ${clientName},

This is a friendly reminder that your payment is due:

🧾 Invoice: *${invoiceNumber}*
💵 Amount: *₹${amount.toLocaleString("en-IN")}*
📅 Due Date: *${dueDate}*

Please make the payment at your earliest convenience.

_Pay via UPI/Card/NetBanking through the client portal_

_This is an automated reminder from CaseFiles_`;
}
