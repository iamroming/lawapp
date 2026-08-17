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

export function formatOwnerHearingReminder(ownerName: string, lawyerName: string, caseNumber: string, caseTitle: string, hearingDate: string, court: string): string {
  return `⚖️ *Hearing Alert — Firm Owner*

Dear ${ownerName},

A hearing is scheduled tomorrow for your firm:

📋 *${caseNumber}* - ${caseTitle}
👨‍⚖️ Assigned to: *${lawyerName}*
📅 Date: *${hearingDate}*
🏛️ Court: *${court}*

Please ensure the case is prepared and all documents are ready.

_This is an automated alert from CaseFiles_`;
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

// ============================
// TRIAL FUNNEL WHATSAPP MESSAGES
// ============================

export function formatTrialWelcome(userName: string, planName: string): string {
  return `🎉 *Welcome to CaseFiles!*

Hi ${userName},

Your *${planName}* trial has started! 🚀

✅ Unlimited cases
✅ WhatsApp hearing reminders
✅ AI legal research
✅ GST invoicing

Start now: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

_No credit card required. Cancel anytime._

_CaseFiles — Your Legal Practice, Simplified_`;
}

export function formatTrialDay3(userName: string, planName: string, casesCount: number): string {
  if (casesCount === 0) {
    return `👋 *How's it going, ${userName}?*

You're 3 days into your ${planName} trial.

⚡ *Quick tip:* Create your first case in 30 seconds!
👉 ${process.env.NEXT_PUBLIC_APP_URL}/cases/new

Need help? Reply to this message anytime.

_CaseFiles_`;
  }
  return `📊 *Your Trial Progress*

Hi ${userName},

Day 3 of your ${planName} trial.

✅ You've created *${casesCount} case${casesCount > 1 ? 's' : ''}*
📈 Keep going!

${casesCount < 5 ? `💡 *Tip:* Try scheduling a hearing for automatic reminders` : `🎯 *Great job!* You're getting the hang of it`}

👉 ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

_CaseFiles_`;
}

export function formatTrialDay7(userName: string, planName: string, casesCount: number): string {
  return `⏰ *Trial Half Over!*

Hi ${userName},

Your ${planName} trial is *50% complete*.
📅 *7 days remaining*

⚠️ After trial ends:
❌ Your ${casesCount} cases will be locked
❌ No more WhatsApp reminders
❌ No AI features

💡 *Upgrade now* — Plans from ₹999/month

👉 ${process.env.NEXT_PUBLIC_APP_URL}/subscription

_CaseFiles_`;
}

export function formatTrialDay12(userName: string, planName: string, casesCount: number): string {
  return `🚨 *URGENT: 2 Days Left!*

Hi ${userName},

Your ${planName} trial ends in *2 days*.

⛔ What you'll lose:
• ${casesCount} cases locked
• No WhatsApp reminders
• No AI research
• No GST invoicing

💰 *Upgrade now* — Starting ₹999/month
👉 ${process.env.NEXT_PUBLIC_APP_URL}/subscription

Don't let your cases slip away!

_CaseFiles_`;
}

export function formatTrialDay14(userName: string, planName: string): string {
  return `⛔ *Trial Ended*

Hi ${userName},

Your ${planName} trial has ended.
Your account is now restricted.

📋 To regain access:
• Choose a plan (from ₹999/month)
• Your data is safe and preserved

👉 ${process.env.NEXT_PUBLIC_APP_URL}/subscription

Subscribe anytime to continue.

_CaseFiles_`;
}
