import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface UnpaidInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  due_date: string;
  client: any;
  days_overdue?: number;
}

async function sendReminderEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "LawXP <noreply@LawXP.app>",
        to,
        subject,
        html: body,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow cron secret auth OR user auth
    const authHeader = request.headers.get("authorization");
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    let body: { invoice_id?: string } = {};
    try {
      body = await request.json();
    } catch {}

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("invoices")
      .select("id, invoice_number, amount, tax_amount, due_date, client:clients(full_name, email)")
      .in("status", ["sent", "overdue"])
      .lte("due_date", today);

    if (userId) {
      query = query.eq("issued_by", userId);
    }

    if (body.invoice_id) {
      query = query.eq("id", body.invoice_id);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: { invoice_id: string; action: string; sent: boolean }[] = [];

    for (const inv of (invoices || []) as any[]) {
      const due = new Date(inv.due_date);
      const now = new Date();
      const daysOverdue = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      const totalAmount = inv.amount + (inv.tax_amount || 0);
      const clientEmail = (inv.client as any)?.email;
      const clientName = (inv.client as any)?.full_name || "Client";

      let subject = "";
      let body = "";
      let action = "";

      if (daysOverdue >= 60) {
        action = "escalation";
        subject = `URGENT: Escalation Notice - Invoice ${inv.invoice_number}`;
        body = `<p>Dear ${clientName},</p>
          <p>This is an escalation notice for Invoice <strong>${inv.invoice_number}</strong> of <strong>₹${totalAmount.toLocaleString("en-IN")}</strong>, which is now <strong>${daysOverdue} days overdue</strong>.</p>
          <p>Immediate payment is required to avoid further action. Please settle this amount at the earliest.</p>
          <p>Regards,<br/>LawXP Legal</p>`;
      } else if (daysOverdue >= 30) {
        action = "final_notice";
        subject = `Final Notice - Invoice ${inv.invoice_number}`;
        body = `<p>Dear ${clientName},</p>
          <p>This is a final notice for Invoice <strong>${inv.invoice_number}</strong> of <strong>₹${totalAmount.toLocaleString("en-IN")}</strong>, which is <strong>${daysOverdue} days overdue</strong>.</p>
          <p>Please make payment within 7 days to avoid escalation.</p>
          <p>Regards,<br/>LawXP Legal</p>`;
      } else if (daysOverdue >= 7) {
        action = "gentle_reminder";
        subject = `Payment Reminder - Invoice ${inv.invoice_number}`;
        body = `<p>Dear ${clientName},</p>
          <p>This is a gentle reminder that Invoice <strong>${inv.invoice_number}</strong> of <strong>₹${totalAmount.toLocaleString("en-IN")}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
          <p>Please make payment at your earliest convenience.</p>
          <p>Regards,<br/>LawXP Legal</p>`;
      } else {
        continue;
      }

      let sent = false;
      if (clientEmail) {
        sent = await sendReminderEmail(clientEmail, subject, body);
      }

      await supabase.from("collection_logs").insert({
        invoice_id: inv.id,
        user_id: userId,
        action,
        channel: "email",
        notes: `Auto-reminder: ${daysOverdue} days overdue`,
        sent_at: new Date().toISOString(),
      });

      if (daysOverdue >= 30) {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", inv.id);
      }

      results.push({ invoice_id: inv.id, action, sent });
    }

    return NextResponse.json({ data: results, processed: results.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET for external cron triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
