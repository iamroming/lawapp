import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [casesRes, tasksRes, deadlinesRes, invoicesRes] = await Promise.all([
      supabase
        .from("cause_list_entries")
        .select("*, case:cases(case_number, title)")
        .eq("user_id", user.id)
        .eq("hearing_date", today),
      supabase
        .from("tasks")
        .select("id, title, due_date, priority")
        .eq("assigned_to", user.id)
        .eq("status", "pending")
        .lte("due_date", tomorrow),
      supabase
        .from("deadline_reminders")
        .select("*, case:cases(case_number, title)")
        .eq("user_id", user.id)
        .eq("reminder_date", today)
        .eq("is_sent", false),
      supabase
        .from("invoices")
        .select("id, invoice_number, amount, tax_amount, due_date, client:clients(full_name)")
        .eq("issued_by", user.id)
        .in("status", ["sent", "overdue"])
        .lte("due_date", today),
    ]);

    const digest = {
      date: today,
      cause_list: casesRes.data || [],
      pending_tasks: tasksRes.data || [],
      upcoming_deadlines: deadlinesRes.data || [],
      outstanding_invoices: (invoicesRes.data || []).map((inv: any) => ({
        ...inv,
        client_name: inv.client?.full_name || "N/A",
      })),
    };

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        const causeListHtml = digest.cause_list.length
          ? digest.cause_list
              .map((c: any) => `<li>${c.case?.case_number || "N/A"} - ${c.court_name}</li>`)
              .join("")
          : "<li>No hearings today</li>";

        const tasksHtml = digest.pending_tasks.length
          ? digest.pending_tasks
              .map((t: any) => `<li>${t.title} (Due: ${t.due_date})</li>`)
              .join("")
          : "<li>No pending tasks</li>";

        const invoiceHtml = digest.outstanding_invoices.length
          ? digest.outstanding_invoices
              .map(
                (i: any) =>
                  `<li>${i.invoice_number} - ₹${(i.amount + (i.tax_amount || 0)).toLocaleString("en-IN")} (${i.client_name})</li>`
              )
              .join("")
          : "<li>No outstanding invoices</li>";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "LawXP <noreply@LawXP.app>",
            to: profile.email,
            subject: `Daily Digest - ${today}`,
            html: `<h2>Daily Digest</h2>
              <h3>Today's Cause List (${digest.cause_list.length})</h3>
              <ul>${causeListHtml}</ul>
              <h3>Pending Tasks (${digest.pending_tasks.length})</h3>
              <ul>${tasksHtml}</ul>
              <h3>Outstanding Invoices (${digest.outstanding_invoices.length})</h3>
              <ul>${invoiceHtml}</ul>`,
          }),
        });
      }
    }

    return NextResponse.json({ data: digest });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
