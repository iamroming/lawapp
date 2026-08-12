import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's role to determine firm scoping
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.uuid)
      .single();

    const isOwnerOrPartner = profile?.role === "owner" || profile?.role === "partner";

    // Get cases: owners/partners see all firm cases; others see only their own
    const { data: cases } = isOwnerOrPartner && profile?.firm_id
      ? await supabase
          .from("cases")
          .select("id, status, total_fee, amount_received, next_hearing_date, created_at")
          .eq("firm_id", profile.firm_id)
          .is("deleted_at", null)
      : await supabase
          .from("cases")
          .select("id, status, total_fee, amount_received, next_hearing_date, created_at")
          .or(`created_by.eq.${user.uuid},assigned_to.eq.${user.uuid}`)
          .is("deleted_at", null);

    // Get clients: owners/partners see all firm clients; others see only their own
    const { data: clients } = isOwnerOrPartner && profile?.firm_id
      ? await supabase
          .from("clients")
          .select("id")
          .eq("firm_id", profile.firm_id)
          .is("deleted_at", null)
      : await supabase
          .from("clients")
          .select("id")
           .eq("created_by", user.uuid)
          .is("deleted_at", null);

    // Get user's case IDs for hearing scoping
    const userCaseIds = cases?.map((c) => c.id) || [];

    // Get upcoming hearings (scoped to user's cases)
    const { data: hearings } = userCaseIds.length > 0
      ? await supabase
          .from("hearings")
          .select("id, hearing_date, is_completed")
          .in("case_id", userCaseIds)
          .is("deleted_at", null)
          .eq("is_completed", false)
          .gte("hearing_date", new Date().toISOString())
          .order("hearing_date")
          .limit(10)
      : { data: [] };

    // Get invoices: owners/partners see all firm invoices; others see issued
    const { data: invoices } = isOwnerOrPartner && profile?.firm_id
      ? await supabase
          .from("invoices")
          .select("id, amount, tax_amount, status, due_date")
          .eq("firm_id", profile.firm_id)
      : await supabase
          .from("invoices")
          .select("id, amount, tax_amount, status, due_date")
           .eq("issued_by", user.uuid);

    // Get documents: owners/partners see all firm documents; others see uploaded
    const { data: documents } = isOwnerOrPartner && profile?.firm_id
      ? await supabase
          .from("documents")
          .select("id")
          .eq("firm_id", profile.firm_id)
      : await supabase
          .from("documents")
          .select("id")
           .eq("uploaded_by", user.uuid);

    // Get time entries this month: owners/partners see all firm entries; others see own
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: timeEntries } = isOwnerOrPartner && profile?.firm_id
      ? await supabase
          .from("time_entries")
          .select("id, hours, is_billable")
          .eq("firm_id", profile.firm_id)
          .gte("date", startOfMonth.toISOString().split("T")[0])
      : await supabase
          .from("time_entries")
          .select("id, hours, is_billable")
           .eq("lawyer_id", user.uuid)
          .gte("date", startOfMonth.toISOString().split("T")[0]);

    // Calculate stats
    const totalCases = cases?.length || 0;
    const activeCases = cases?.filter((c) => !["won", "lost", "settled", "closed", "dismissed"].includes(c.status)).length || 0;
    const pendingCases = cases?.filter((c) => c.status === "pending").length || 0;
    const totalClients = clients?.length || 0;

    const totalRevenue = cases?.reduce((sum, c) => sum + (c.total_fee || 0), 0) || 0;
    const totalReceived = cases?.reduce((sum, c) => sum + (c.amount_received || 0), 0) || 0;
    const totalPending = totalRevenue - totalReceived;

    const pendingInvoices = invoices?.filter((i) => i.status === "sent" || i.status === "overdue") || [];
    const overdueInvoices = invoices?.filter((i) => i.status === "overdue") || [];
    const totalInvoicesPending = pendingInvoices.reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);
    const totalInvoicesOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);

    const billableHours = timeEntries?.filter((t) => t.is_billable).reduce((sum, t) => sum + t.hours, 0) || 0;
    const nonBillableHours = timeEntries?.filter((t) => !t.is_billable).reduce((sum, t) => sum + t.hours, 0) || 0;

    // Upcoming hearings summary
    const hearingsThisWeek = hearings?.filter((h) => {
      const hearingDate = new Date(h.hearing_date);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return hearingDate >= now && hearingDate <= weekFromNow;
    }).length || 0;

    const hearingsToday = hearings?.filter((h) => {
      const hearingDate = new Date(h.hearing_date);
      const today = new Date();
      return hearingDate.toDateString() === today.toDateString();
    }).length || 0;

    return NextResponse.json({
      data: {
        cases: {
          total: totalCases,
          active: activeCases,
          pending: pendingCases,
          by_status: {
            pending: cases?.filter((c) => c.status === "pending").length || 0,
            active: cases?.filter((c) => c.status === "active").length || 0,
            in_progress: cases?.filter((c) => c.status === "in-progress").length || 0,
            under_trial: cases?.filter((c) => c.status === "under-trial").length || 0,
            won: cases?.filter((c) => c.status === "won").length || 0,
            lost: cases?.filter((c) => c.status === "lost").length || 0,
            settled: cases?.filter((c) => c.status === "settled").length || 0,
            closed: cases?.filter((c) => c.status === "closed").length || 0,
            adjourned: cases?.filter((c) => c.status === "adjourned").length || 0,
            dismissed: cases?.filter((c) => c.status === "dismissed").length || 0,
          },
        },
        clients: {
          total: totalClients,
        },
        revenue: {
          total: totalRevenue,
          received: totalReceived,
          pending: totalPending,
          collection_rate: totalRevenue > 0 ? Math.round((totalReceived / totalRevenue) * 100) : 0,
        },
        billing: {
          total_pending: totalInvoicesPending,
          total_overdue: totalInvoicesOverdue,
          pending_count: pendingInvoices.length,
          overdue_count: overdueInvoices.length,
        },
        time: {
          billable_hours: billableHours,
          non_billable_hours: nonBillableHours,
          utilization_rate: (billableHours + nonBillableHours) > 0
            ? Math.round((billableHours / (billableHours + nonBillableHours)) * 100)
            : 0,
        },
        hearings: {
          upcoming: hearings?.length || 0,
          this_week: hearingsThisWeek,
          today: hearingsToday,
        },
        documents: {
          total: documents?.length || 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
