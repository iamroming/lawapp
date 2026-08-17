import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // weekly | monthly | yearly
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    const firmId = profile?.firm_id;
    const isOwner = ["owner", "partner"].includes(profile?.role || "");

    // --- Fetch Income (payments) ---
    let paymentQuery = supabase.from("payments").select("amount, payment_date, payment_method, status");
    if (isOwner && firmId) {
      paymentQuery = paymentQuery.eq("firm_id", firmId);
    } else {
      paymentQuery = paymentQuery.eq("received_by", user.uuid);
    }
    if (startDate) paymentQuery = paymentQuery.gte("payment_date", startDate);
    if (endDate) paymentQuery = paymentQuery.lte("payment_date", endDate);

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    // --- Fetch Expenses ---
    let expenseQuery = supabase.from("expenses").select("amount, expense_date, category, is_billable");
    if (isOwner && firmId) {
      expenseQuery = expenseQuery.eq("firm_id", firmId);
    } else {
      expenseQuery = expenseQuery.eq("user_id", user.uuid);
    }
    if (startDate) expenseQuery = expenseQuery.gte("expense_date", startDate);
    if (endDate) expenseQuery = expenseQuery.lte("expense_date", endDate);

    const { data: expenses, error: expenseError } = await expenseQuery;
    if (expenseError) throw expenseError;

    const allPayments = payments || [];
    const allExpenses = expenses || [];

    // --- Helper: get period key ---
    const getPeriodKey = (dateStr: string): string => {
      const d = new Date(dateStr);
      if (period === "weekly") {
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        return `${d.getFullYear()} W${String(weekNum).padStart(2, "0")}`;
      }
      if (period === "yearly") return `${d.getFullYear()}`;
      return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    };

    // --- Build period map ---
    const periodMap: Record<string, { income: number; expenses: number; billableExpenses: number }> = {};

    for (const p of allPayments) {
      const key = getPeriodKey(p.payment_date);
      if (!periodMap[key]) periodMap[key] = { income: 0, expenses: 0, billableExpenses: 0 };
      periodMap[key].income += p.amount || 0;
    }

    for (const e of allExpenses) {
      const key = getPeriodKey(e.expense_date);
      if (!periodMap[key]) periodMap[key] = { income: 0, expenses: 0, billableExpenses: 0 };
      periodMap[key].expenses += e.amount || 0;
      if (e.is_billable) periodMap[key].billableExpenses += e.amount || 0;
    }

    // Sort periods chronologically
    const sortedKeys = Object.keys(periodMap).sort((a, b) => {
      const parsePeriod = (k: string) => {
        if (period === "yearly") return new Date(k, 0, 1).getTime();
        if (period === "weekly") {
          const [year, week] = k.split(" W");
          return new Date(parseInt(year), 0, 1).getTime() + parseInt(week) * 7 * 86400000;
        }
        return new Date(k).getTime();
      };
      return parsePeriod(a) - parsePeriod(b);
    });

    const timeline = sortedKeys.map((key) => {
      const { income, expenses, billableExpenses } = periodMap[key];
      return {
        period: key,
        income,
        expenses,
        billableExpenses,
        netProfit: income - expenses,
      };
    });

    // --- Totals ---
    const totalIncome = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalBillableExpenses = allExpenses.filter((e) => e.is_billable).reduce((s, e) => s + (e.amount || 0), 0);

    // --- Expense breakdown by category ---
    const byCategory: Record<string, number> = {};
    for (const e of allExpenses) {
      const cat = e.category || "other";
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
    }
    const expenseByCategory = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // --- Income by payment method ---
    const byMethod: Record<string, number> = {};
    for (const p of allPayments) {
      const method = p.payment_method || "other";
      byMethod[method] = (byMethod[method] || 0) + (p.amount || 0);
    }
    const incomeByMethod = Object.entries(byMethod)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        totalBillableExpenses,
        netProfit: totalIncome - totalExpenses,
        profitMargin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      },
      timeline,
      expenseByCategory,
      incomeByMethod,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
