import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!type) {
    return NextResponse.json({ error: "type parameter is required" }, { status: 400 });
  }

  const buildQuery = (table: string) => {
    let query = supabase.from(table).select("*");
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    return query;
  };

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.id).single();
  const firmId = profile?.firm_id;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  try {
    switch (type) {
      case "cases": {
        let caseQuery = buildQuery("cases");
        if (isOwner && firmId) {
          caseQuery = caseQuery.eq("firm_id", firmId);
        } else {
          caseQuery = caseQuery.or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);
        }
        const { data: cases, error } = await caseQuery;
        if (error) throw error;

        const allCases = cases || [];
        const byStatus: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const byCourt: Record<string, number> = {};

        allCases.forEach((c: any) => {
          byStatus[c.status] = (byStatus[c.status] || 0) + 1;
          byType[c.type || "Other"] = (byType[c.type || "Other"] || 0) + 1;
          byCourt[c.court || "Unknown"] = (byCourt[c.court || "Unknown"] || 0) + 1;
        });

        const resolved = allCases.filter((c: any) =>
          ["won", "lost", "settled", "dismissed"].includes(c.status)
        );
        const winLoss = {
          won: resolved.filter((c: any) => c.status === "won").length,
          lost: resolved.filter((c: any) => c.status === "lost").length,
          settled: resolved.filter((c: any) => c.status === "settled").length,
          dismissed: resolved.filter((c: any) => c.status === "dismissed").length,
          total: resolved.length,
        };

        const avgDuration =
          allCases.length > 0
            ? allCases.reduce((sum: number, c: any) => {
                const created = new Date(c.created_at).getTime();
                return sum + (Date.now() - created) / (1000 * 60 * 60 * 24);
              }, 0) / allCases.length
            : 0;

        return NextResponse.json({
          totalCases: allCases.length,
          byStatus,
          byType,
          byCourt,
          winLoss,
          avgDuration: Math.round(avgDuration),
        });
      }

      case "revenue": {
        let paymentQuery = supabase.from("payments").select("*");
        let invoiceQuery = supabase.from("invoices").select("*");

        if (isOwner && firmId) {
          paymentQuery = paymentQuery.eq("firm_id", firmId);
          invoiceQuery = invoiceQuery.eq("firm_id", firmId);
        } else {
          paymentQuery = paymentQuery.eq("received_by", user.id);
          invoiceQuery = invoiceQuery.eq("issued_by", user.id);
        }

        if (startDate) {
          paymentQuery = paymentQuery.gte("payment_date", startDate);
          invoiceQuery = invoiceQuery.gte("created_at", startDate);
        }
        if (endDate) {
          paymentQuery = paymentQuery.lte("payment_date", endDate);
          invoiceQuery = invoiceQuery.lte("created_at", endDate);
        }

        const { data: payments, error: paymentError } = await paymentQuery;
        if (paymentError) throw paymentError;

        const { data: invoices, error: invoiceError } = await invoiceQuery;
        if (invoiceError) throw invoiceError;

        const allPayments = payments || [];
        const allInvoices = invoices || [];

        const monthlyRevenue: Record<string, number> = {};
        allPayments.forEach((p: any) => {
          const month = new Date(p.payment_date).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
        });

        const totalRevenue = allPayments.reduce(
          (sum: number, p: any) => sum + (p.amount || 0),
          0
        );
        const outstandingAmount = allInvoices
          .filter((i: any) => i.status === "sent" || i.status === "overdue")
          .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);
        const gstCollected = allInvoices.reduce(
          (sum: number, i: any) => sum + (i.tax_amount || 0),
          0
        );

        return NextResponse.json({
          totalRevenue,
          monthlyRevenue,
          outstandingAmount,
          gstCollected,
          pendingInvoices: allInvoices.filter(
            (i: any) => i.status === "sent" || i.status === "overdue"
          ).length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
