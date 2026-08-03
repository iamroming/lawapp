import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Daily digest: today's hearings, upcoming deadlines, pending tasks
// Cron: runs daily at 8AM IST
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    // Get all active firms
    const { data: firms } = await supabase
      .from("profiles")
      .select("firm_id")
      .not("firm_id", "is", null)
      .eq("is_active", true);

    const uniqueFirmIds = [...new Set((firms || []).map((f: any) => f.firm_id).filter(Boolean))];
    let digestsSent = 0;

    for (const firmId of uniqueFirmIds) {
      // Get firm owner/partner emails
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, email, full_name, firm_name")
        .eq("firm_id", firmId)
        .in("role", ["owner", "partner"])
        .eq("is_active", true);

      if (!owners?.length) continue;

      // 1. Today's hearings
      const { data: todayHearings, error: todayError } = await supabase
        .from("hearings")
        .select("*, case:cases(id, title, case_number, court, judge_name)")
        .eq("firm_id", firmId)
        .gte("hearing_date", todayStr)
        .lt("hearing_date", tomorrowStr)
        .eq("is_completed", false)
        .is("deleted_at", null);
      if (todayError) console.error("Daily digest today hearings error:", todayError.message);

      // 2. This week's hearings
      const { data: weekHearings, error: weekError } = await supabase
        .from("hearings")
        .select("*, case:cases(id, title, case_number, court)")
        .eq("firm_id", firmId)
        .gte("hearing_date", tomorrowStr)
        .lte("hearing_date", nextWeekStr)
        .eq("is_completed", false)
        .is("deleted_at", null);
      if (weekError) console.error("Daily digest week hearings error:", weekError.message);

      // 3. Pending tasks
      const { data: pendingTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, due_date, priority, assigned_to:profiles!tasks_assigned_to_fkey(full_name)")
        .eq("firm_id", firmId)
        .in("status", ["todo", "in_progress"])
        .lte("due_date", nextWeekStr)
        .order("due_date", { ascending: true })
        .limit(10);
      if (tasksError) console.error("Daily digest tasks error:", tasksError.message);

      // 4. Overdue invoices
      const { data: overdueInvoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, tax_amount, due_date, client:clients(full_name)")
        .eq("firm_id", firmId)
        .eq("status", "pending")
        .lt("due_date", todayStr);
      if (invoicesError) console.error("Daily digest invoices error:", invoicesError.message);

      // Build digest content
      const hearingCount = (todayHearings?.length || 0);
      const weekCount = (weekHearings?.length || 0);
      const taskCount = (pendingTasks?.length || 0);
      const invoiceCount = (overdueInvoices?.length || 0);

      // Skip if nothing to report
      if (hearingCount === 0 && taskCount === 0 && invoiceCount === 0) continue;

      // Build HTML
      let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">LawXP Daily Digest</h1>
            <p style="margin: 5px 0 0;">${today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
      `;

      // Today's hearings
      if (hearingCount > 0) {
        html += `<h2 style="color: #dc2626;">Today's Hearings (${hearingCount})</h2>`;
        for (const h of todayHearings || []) {
          const c = Array.isArray(h.case) ? h.case[0] : h.case;
          html += `
            <div style="background: white; padding: 12px; border-left: 4px solid #dc2626; margin: 8px 0; border-radius: 4px;">
              <p style="margin:0;"><strong>${c?.case_number || "N/A"}</strong> — ${c?.title || "N/A"}</p>
              <p style="margin:4px 0 0; color: #6b7280; font-size: 13px;">${c?.court || ""} ${c?.judge_name ? "| Judge: " + c.judge_name : ""}</p>
              ${h.purpose ? `<p style="margin:4px 0 0; font-size: 13px;">Purpose: ${h.purpose}</p>` : ""}
            </div>
          `;
        }
      }

      // Upcoming week hearings
      if (weekCount > 0) {
        html += `<h2 style="color: #f59e0b;">This Week (${weekCount})</h2>`;
        for (const h of weekHearings || []) {
          const c = Array.isArray(h.case) ? h.case[0] : h.case;
          html += `
            <div style="background: white; padding: 10px; border-left: 4px solid #f59e0b; margin: 6px 0; border-radius: 4px;">
              <p style="margin:0;"><strong>${new Date(h.hearing_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</strong> — ${c?.case_number || "N/A"} ${c?.title || ""}</p>
            </div>
          `;
        }
      }

      // Pending tasks
      if (taskCount > 0) {
        html += `<h2 style="color: #7c3aed;">Pending Tasks (${taskCount})</h2>`;
        for (const t of pendingTasks || []) {
          const assignee = Array.isArray(t.assigned_to) ? t.assigned_to[0] : t.assigned_to;
          const isOverdue = t.due_date && new Date(t.due_date) < today;
          html += `
            <div style="background: white; padding: 10px; border-left: 4px solid ${isOverdue ? "#dc2626" : "#7c3aed"}; margin: 6px 0; border-radius: 4px;">
              <p style="margin:0;"><strong>${t.title}</strong></p>
              <p style="margin:4px 0 0; font-size: 13px; color: #6b7280;">
                ${t.due_date ? "Due: " + new Date(t.due_date).toLocaleDateString("en-IN") : "No due date"}
                ${assignee ? " | Assigned to: " + assignee.full_name : ""}
                ${isOverdue ? ' <span style="color: #dc2626;">(OVERDUE)</span>' : ""}
              </p>
            </div>
          `;
        }
      }

      // Overdue invoices
      if (invoiceCount > 0) {
        html += `<h2 style="color: #dc2626;">Overdue Payments (${invoiceCount})</h2>`;
        for (const inv of overdueInvoices || []) {
          const client = Array.isArray(inv.client) ? inv.client[0] : inv.client;
          html += `
            <div style="background: white; padding: 10px; border-left: 4px solid #dc2626; margin: 6px 0; border-radius: 4px;">
              <p style="margin:0;"><strong>${inv.invoice_number || "N/A"}</strong> — Rs. ${((inv.amount || 0) + (inv.tax_amount || 0)).toLocaleString("en-IN")}</p>
              <p style="margin:4px 0 0; font-size: 13px; color: #6b7280;">Client: ${client?.full_name || "N/A"} | Due: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "N/A"}</p>
            </div>
          `;
        }
      }

      html += `
          </div>
          <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This is your daily digest from LawXP.</p>
          </div>
        </div>
      `;

      // Send email to each owner/partner
      if (process.env.RESEND_API_KEY) {
        for (const owner of owners) {
          if (!owner.email) continue;
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
              from: process.env.EMAIL_FROM || "LawXP <digest@LawXP.in>",
              to: owner.email,
              subject: `Daily Digest — ${hearingCount} hearing(s), ${taskCount} task(s), ${invoiceCount} overdue payment(s)`,
              html,
            });
            digestsSent++;
          } catch (emailErr) {
            console.error(`Failed to send digest to ${owner.email}:`, emailErr);
          }
        }
      }
    }

    return NextResponse.json({
      message: "Daily digest processed",
      firms: uniqueFirmIds.length,
      digestsSent,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
