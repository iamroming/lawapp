import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET /api/analytics?type=...&startDate=...&endDate=...
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "overview";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;
  if (!firmId) return NextResponse.json({ error: "No firm" }, { status: 400 });

  // Role check: only owner/partner/senior_associate can view analytics
  const analyticsRoles = ["owner", "partner", "senior_associate", "super_admin"];
  if (!profile?.role || !analyticsRoles.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  const dateFilter = (query: any) => {
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    return query;
  };

  try {
    switch (type) {
      // ==================== PHASE 1 ====================
      case "win_rate_by_judge": {
        const { data } = await dateFilter(
          supabase.from("cases").select("judge_name, status")
            .eq("firm_id", firmId).is("deleted_at", null)
        );
        const judgeMap: Record<string, { total: number; won: number; lost: number; settled: number }> = {};
        for (const c of data || []) {
          const judge = c.judge_name || "Unknown";
          if (!judgeMap[judge]) judgeMap[judge] = { total: 0, won: 0, lost: 0, settled: 0 };
          judgeMap[judge].total++;
          if (c.status === "won") judgeMap[judge].won++;
          else if (c.status === "lost") judgeMap[judge].lost++;
          else if (c.status === "settled") judgeMap[judge].settled++;
        }
        const result = Object.entries(judgeMap)
          .map(([judge, stats]) => ({
            judge,
            ...stats,
            winRate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total);
        return NextResponse.json(result);
      }

      case "avg_payment_time": {
        const { data } = await dateFilter(
          supabase.from("payments").select("created_at, invoice_id, invoices(created_at)")
            .eq("firm_id", firmId)
        );
        const days: number[] = [];
        for (const p of data || []) {
          const inv = Array.isArray(p.invoices) ? p.invoices[0] : p.invoices;
          if (inv?.created_at && p.created_at) {
            const diff = (new Date(p.created_at).getTime() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (diff >= 0) days.push(Math.round(diff));
          }
        }
        const avg = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
        const median = days.length > 0 ? days.sort((a, b) => a - b)[Math.floor(days.length / 2)] : 0;
        const histogram: Record<string, number> = {};
        for (const d of days) {
          const bucket = d <= 7 ? "0-7 days" : d <= 30 ? "8-30 days" : d <= 60 ? "31-60 days" : "60+ days";
          histogram[bucket] = (histogram[bucket] || 0) + 1;
        }
        return NextResponse.json({ avgDays: avg, medianDays: median, total: days.length, histogram });
      }

      case "time_utilization": {
        const { data } = await dateFilter(
          supabase.from("time_entries").select("user_id, profiles(full_name), hours, billable, created_at")
            .eq("firm_id", firmId)
        );
        const lawyerMap: Record<string, { name: string; billable: number; nonBillable: number; total: number }> = {};
        for (const e of data || []) {
          const u = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
          const name = u?.full_name || "Unknown";
          if (!lawyerMap[e.user_id]) lawyerMap[e.user_id] = { name, billable: 0, nonBillable: 0, total: 0 };
          lawyerMap[e.user_id].total += e.hours || 0;
          if (e.billable) lawyerMap[e.user_id].billable += e.hours || 0;
          else lawyerMap[e.user_id].nonBillable += e.hours || 0;
        }
        const result = Object.values(lawyerMap).map(l => ({
          ...l,
          utilizationRate: l.total > 0 ? Math.round((l.billable / l.total) * 100) : 0,
        })).sort((a, b) => b.total - a.total);
        return NextResponse.json(result);
      }

      case "client_ltv": {
        const { data: clients } = await supabase
          .from("clients").select("id, full_name, email")
          .eq("firm_id", firmId).is("deleted_at", null);

        const clientIds = (clients || []).map((c) => c.id);

        const { data: allPayments } = clientIds.length > 0
          ? await supabase.from("payments").select("client_id, amount").in("client_id", clientIds)
          : { data: [] };

        const { data: allCases } = clientIds.length > 0
          ? await supabase.from("cases").select("client_id").eq("firm_id", firmId).is("deleted_at", null).in("client_id", clientIds)
          : { data: [] };

        const paymentByClient: Record<string, number> = {};
        for (const p of allPayments || []) {
          paymentByClient[p.client_id] = (paymentByClient[p.client_id] || 0) + (p.amount || 0);
        }

        const casesByClient: Record<string, number> = {};
        for (const c of allCases || []) {
          casesByClient[c.client_id] = (casesByClient[c.client_id] || 0) + 1;
        }

        const ltvData = (clients || []).map((client) => ({
          clientId: client.id,
          name: client.full_name,
          email: client.email,
          totalRevenue: paymentByClient[client.id] || 0,
          caseCount: casesByClient[client.id] || 0,
        }));

        ltvData.sort((a, b) => b.totalRevenue - a.totalRevenue);
        const avgLtv = ltvData.length > 0 ? Math.round(ltvData.reduce((s, c) => s + c.totalRevenue, 0) / ltvData.length) : 0;
        return NextResponse.json({ clients: ltvData.slice(0, 50), avgLtv, totalClients: ltvData.length });
      }

      case "case_duration_by_type": {
        const { data } = await dateFilter(
          supabase.from("cases").select("case_type, filing_date, status, created_at, updated_at")
            .eq("firm_id", firmId).is("deleted_at", null).not("status", "in", "(pending,active,in-progress)")
        );
        const typeMap: Record<string, number[]> = {};
        for (const c of data || []) {
          const start = c.filing_date ? new Date(c.filing_date) : new Date(c.created_at);
          const end = new Date(c.updated_at);
          const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) {
            if (!typeMap[c.case_type]) typeMap[c.case_type] = [];
            typeMap[c.case_type].push(days);
          }
        }
        const result = Object.entries(typeMap).map(([type, durations]) => ({
          type,
          avgDays: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
          minDays: Math.min(...durations),
          maxDays: Math.max(...durations),
          count: durations.length,
        })).sort((a, b) => b.count - a.count);
        return NextResponse.json(result);
      }

      // ==================== PHASE 2 ====================
      case "revenue_forecast": {
        const { data } = await dateFilter(
          supabase.from("payments").select("amount, created_at")
            .eq("firm_id", firmId)
        );
        const monthlyRevenue: Record<string, number> = {};
        for (const p of data || []) {
          const month = new Date(p.created_at).toISOString().slice(0, 7);
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
        }
        const months = Object.keys(monthlyRevenue).sort();
        const values = months.map(m => monthlyRevenue[m]);

        // Simple linear regression for forecast
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
          sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
        }
        const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
        const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

        // Forecast next 3 months
        const forecasts = [];
        for (let i = 1; i <= 3; i++) {
          const predicted = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + i);
          forecasts.push({ month: futureDate.toISOString().slice(0, 7), predicted });
        }

        return NextResponse.json({
          historical: months.map((m, i) => ({ month: m, actual: values[i] })),
          forecast: forecasts,
          trend: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
          avgMonthly: n > 0 ? Math.round(sumY / n) : 0,
        });
      }

      case "payment_methods": {
        const { data } = await dateFilter(
          supabase.from("payments").select("payment_method")
            .eq("firm_id", firmId)
        );
        const methods: Record<string, number> = {};
        for (const p of data || []) {
          const m = p.payment_method || "Other";
          methods[m] = (methods[m] || 0) + 1;
        }
        return NextResponse.json(Object.entries(methods).map(([method, count]) => ({ method, count })));
      }

      case "profit_by_case_type": {
        const { data: cases } = await supabase
          .from("cases").select("id, case_type, total_fee")
          .eq("firm_id", firmId).is("deleted_at", null);

        const caseIds = (cases || []).map((c) => c.id);

        const { data: allExpenses } = caseIds.length > 0
          ? await supabase.from("expenses").select("case_id, amount").in("case_id", caseIds)
          : { data: [] };

        const expensesByCase: Record<string, number> = {};
        for (const e of allExpenses || []) {
          expensesByCase[e.case_id] = (expensesByCase[e.case_id] || 0) + (e.amount || 0);
        }

        const typeMap: Record<string, { revenue: number; expenses: number; count: number }> = {};
        for (const c of cases || []) {
          if (!typeMap[c.case_type]) typeMap[c.case_type] = { revenue: 0, expenses: 0, count: 0 };
          typeMap[c.case_type].revenue += c.total_fee || 0;
          typeMap[c.case_type].count++;
          typeMap[c.case_type].expenses += expensesByCase[c.id] || 0;
        }

        const result = Object.entries(typeMap).map(([type, data]) => ({
          type,
          ...data,
          profit: data.revenue - data.expenses,
          margin: data.revenue > 0 ? Math.round(((data.revenue - data.expenses) / data.revenue) * 100) : 0,
        })).sort((a, b) => b.revenue - a.revenue);
        return NextResponse.json(result);
      }

      case "revenue_per_lawyer": {
        const { data } = await dateFilter(
          supabase.from("cases").select("assigned_to, total_fee, created_at, profiles(full_name)")
            .eq("firm_id", firmId).is("deleted_at", null)
        );
        const lawyerMap: Record<string, { name: string; revenue: number; months: Record<string, number> }> = {};
        for (const c of data || []) {
          if (!c.assigned_to) continue;
          const u = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          if (!lawyerMap[c.assigned_to]) lawyerMap[c.assigned_to] = { name: u?.full_name || "Unknown", revenue: 0, months: {} };
          lawyerMap[c.assigned_to].revenue += c.total_fee || 0;
          const month = new Date(c.created_at).toISOString().slice(0, 7);
          lawyerMap[c.assigned_to].months[month] = (lawyerMap[c.assigned_to].months[month] || 0) + (c.total_fee || 0);
        }
        return NextResponse.json(Object.values(lawyerMap).sort((a, b) => b.revenue - a.revenue));
      }

      case "expense_ratio": {
        const { data: exps } = await dateFilter(
          supabase.from("expenses").select("amount, category, created_at")
            .eq("firm_id", firmId)
        );
        const { data: revs } = await dateFilter(
          supabase.from("payments").select("amount, created_at")
            .eq("firm_id", firmId)
        );
        const monthlyExpenses: Record<string, number> = {};
        const monthlyRevenue: Record<string, number> = {};
        for (const e of exps || []) {
          const m = new Date(e.created_at).toISOString().slice(0, 7);
          monthlyExpenses[m] = (monthlyExpenses[m] || 0) + (e.amount || 0);
        }
        for (const r of revs || []) {
          const m = new Date(r.created_at).toISOString().slice(0, 7);
          monthlyRevenue[m] = (monthlyRevenue[m] || 0) + (r.amount || 0);
        }
        const allMonths = [...new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyRevenue)])].sort();
        const result = allMonths.map(m => ({
          month: m,
          revenue: monthlyRevenue[m] || 0,
          expenses: monthlyExpenses[m] || 0,
          ratio: monthlyRevenue[m] ? Math.round(((monthlyRevenue[m] - (monthlyExpenses[m] || 0)) / monthlyRevenue[m]) * 100) : 0,
        }));
        return NextResponse.json(result);
      }

      // ==================== PHASE 3 ====================
      case "adjournment_rate": {
        const { data: firmCases } = await supabase.from("cases").select("id").eq("firm_id", firmId).is("deleted_at", null);
        const caseIds = (firmCases || []).map((c: any) => c.id);
        const { data: hearings } = await supabase.from("hearings").select("is_completed, outcome").in("case_id", caseIds);
        const total = hearings?.length || 0;
        const adjourned = (hearings || []).filter(h => h.outcome?.toLowerCase().includes("adjourn") || h.outcome?.toLowerCase().includes("postpone")).length;
        return NextResponse.json({ total, adjourned, rate: total > 0 ? Math.round((adjourned / total) * 100) : 0 });
      }

      case "hearings_per_case": {
        const { data: firmCases } = await supabase.from("cases").select("id").eq("firm_id", firmId).is("deleted_at", null);
        const caseIds = (firmCases || []).map((c: any) => c.id);
        const { data: hearings } = await supabase.from("hearings").select("case_id").in("case_id", caseIds);
        const hearingCounts: Record<string, number> = {};
        for (const h of hearings || []) {
          hearingCounts[h.case_id] = (hearingCounts[h.case_id] || 0) + 1;
        }
        const counts = Object.values(hearingCounts);
        const avg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
        const distribution: Record<string, number> = {};
        for (const c of counts) {
          const bucket = c === 1 ? "1" : c <= 3 ? "2-3" : c <= 5 ? "4-5" : "6+";
          distribution[bucket] = (distribution[bucket] || 0) + 1;
        }
        return NextResponse.json({ avg, distribution, totalCases: counts.length });
      }

      case "client_retention": {
        const { data } = await supabase
          .from("clients").select("id, created_at")
          .eq("firm_id", firmId).is("deleted_at", null);

        const clientIds = (data || []).map((c) => c.id);

        const { data: allCases } = clientIds.length > 0
          ? await supabase.from("cases").select("client_id").eq("firm_id", firmId).is("deleted_at", null).in("client_id", clientIds)
          : { data: [] };

        const casesByClient: Record<string, number> = {};
        for (const c of allCases || []) {
          casesByClient[c.client_id] = (casesByClient[c.client_id] || 0) + 1;
        }

        const total = (data || []).length;
        let returning = 0;
        for (const client of data || []) {
          if ((casesByClient[client.id] || 0) > 1) returning++;
        }
        const oneTime = total - returning;

        return NextResponse.json({
          total,
          oneTime,
          returning,
          retentionRate: total > 0 ? Math.round((returning / total) * 100) : 0,
        });
      }

      case "task_completion": {
        const { data } = await dateFilter(
          supabase.from("tasks").select("assigned_to, status, due_date, completed_at, profiles(full_name)")
            .eq("firm_id", firmId)
        );
        const lawyerMap: Record<string, { name: string; completed: number; overdue: number; total: number }> = {};
        for (const t of data || []) {
          if (!t.assigned_to) continue;
          const u = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
          if (!lawyerMap[t.assigned_to]) lawyerMap[t.assigned_to] = { name: u?.full_name || "Unknown", completed: 0, overdue: 0, total: 0 };
          lawyerMap[t.assigned_to].total++;
          if (t.status === "done") {
            lawyerMap[t.assigned_to].completed++;
            if (t.due_date && t.completed_at && new Date(t.completed_at) > new Date(t.due_date)) {
              lawyerMap[t.assigned_to].overdue++;
            }
          }
        }
        const result = Object.values(lawyerMap).map(l => ({
          ...l,
          completionRate: l.total > 0 ? Math.round((l.completed / l.total) * 100) : 0,
        })).sort((a, b) => b.completionRate - a.completionRate);
        return NextResponse.json(result);
      }

      case "case_load_balance": {
        const { data } = await supabase
          .from("cases").select("assigned_to, profiles(full_name)")
          .eq("firm_id", firmId).is("deleted_at", null).not("status", "in", "(won,lost,settled,closed)");
        const lawyerCounts: Record<string, { name: string; count: number }> = {};
        for (const c of data || []) {
          if (!c.assigned_to) continue;
          const u = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
          if (!lawyerCounts[c.assigned_to]) lawyerCounts[c.assigned_to] = { name: u?.full_name || "Unknown", count: 0 };
          lawyerCounts[c.assigned_to].count++;
        }
        const counts = Object.values(lawyerCounts).map(l => l.count);
        const avg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
        const stdDev = counts.length > 0 ? Math.round(Math.sqrt(counts.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / counts.length)) : 0;
        return NextResponse.json({
          lawyers: Object.values(lawyerCounts).sort((a, b) => b.count - a.count),
          avg, stdDev,
          balanced: stdDev <= 2,
        });
      }

      // ==================== PHASE 4 ====================
      case "risk_score": {
        const { data } = await dateFilter(
          supabase.from("cases").select("id, case_type, judge_name, court, status, filing_date")
            .eq("firm_id", firmId).is("deleted_at", null).in("status", ["active", "in-progress", "under-trial"])
        );
        // Simple risk model based on case duration, court, case type
        const results = (data || []).map(c => {
          const daysSinceFiling = c.filing_date
            ? Math.round((Date.now() - new Date(c.filing_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          let riskScore = 50; // base
          if (daysSinceFiling > 365) riskScore += 20;
          else if (daysSinceFiling > 180) riskScore += 10;
          if (c.case_type === "Criminal") riskScore += 10;
          riskScore = Math.min(100, Math.max(0, riskScore));
          return {
            caseId: c.id,
            type: c.case_type,
            court: c.court,
            daysSinceFiling,
            riskScore,
            riskLevel: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
          };
        });
        return NextResponse.json(results.sort((a, b) => b.riskScore - a.riskScore));
      }

      default:
        return NextResponse.json({ error: "Unknown analytics type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
