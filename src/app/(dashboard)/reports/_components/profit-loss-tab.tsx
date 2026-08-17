"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/bar-chart";
import { StatsCard } from "@/components/ui/stats-card";
import { IndianRupee, TrendingUp, TrendingDown, Percent, Receipt, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface PLSummary {
  totalIncome: number;
  totalExpenses: number;
  totalBillableExpenses: number;
  netProfit: number;
  profitMargin: number;
}

interface PLPeriod {
  period: string;
  income: number;
  expenses: number;
  billableExpenses: number;
  netProfit: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
}

interface MethodBreakdown {
  method: string;
  amount: number;
}

interface PLData {
  summary: PLSummary;
  timeline: PLPeriod[];
  expenseByCategory: CategoryBreakdown[];
  incomeByMethod: MethodBreakdown[];
}

const CATEGORY_LABELS: Record<string, string> = {
  court_fees: "Court Fees",
  travel: "Travel",
  filing: "Filing",
  notary: "Notary",
  stamp_duty: "Stamp Duty",
  postal: "Postal",
  photocopy: "Photocopy",
  other: "Other",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  razorpay: "Razorpay",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

export default function ProfitLossTab() {
  const [data, setData] = useState<PLData | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/profit-loss?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading Profit & Loss report...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">No data available</div>;
  }

  const { summary, timeline, expenseByCategory, incomeByMethod } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit & Loss Report</h1>
          <p className="text-sm text-[var(--text-secondary)]">Income, expenses, and net profit overview</p>
        </div>
        <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
          {(["weekly", "monthly", "yearly"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Income"
          value={`Rs. ${summary.totalIncome.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="h-5 w-5" />}
          trend="up"
        />
        <StatsCard
          title="Total Expenses"
          value={`Rs. ${summary.totalExpenses.toLocaleString("en-IN")}`}
          icon={<Receipt className="h-5 w-5" />}
          trend={summary.totalExpenses > summary.totalIncome ? "down" : "neutral"}
        />
        <StatsCard
          title="Net Profit"
          value={`Rs. ${summary.netProfit.toLocaleString("en-IN")}`}
          icon={summary.netProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          trend={summary.netProfit >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Profit Margin"
          value={`${summary.profitMargin}%`}
          icon={<Percent className="h-5 w-5" />}
          trend={summary.profitMargin >= 30 ? "up" : summary.profitMargin >= 0 ? "neutral" : "down"}
        />
      </div>

      {/* P&L Statement Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Period</th>
                  <th className="text-right py-2 font-medium text-green-600">Income</th>
                  <th className="text-right py-2 font-medium text-red-600">Expenses</th>
                  <th className="text-right py-2 font-medium text-[var(--text-secondary)]">Billable</th>
                  <th className="text-right py-2 font-medium">Net Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row) => (
                  <tr key={row.period} className="border-b border-[var(--border)] hover:bg-[var(--surface-subtle)]">
                    <td className="py-2.5 font-medium">{row.period}</td>
                    <td className="py-2.5 text-right text-green-600">
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownLeft className="h-3 w-3" />
                        Rs. {row.income.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-red-600">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Rs. {row.expenses.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-secondary)]">
                      Rs. {row.billableExpenses.toLocaleString("en-IN")}
                    </td>
                    <td className={`py-2.5 text-right font-semibold ${row.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.netProfit >= 0 ? "+" : ""} Rs. {row.netProfit.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {timeline.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">No data for this period</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] font-bold">
                  <td className="py-2.5">Total</td>
                  <td className="py-2.5 text-right text-green-600">Rs. {summary.totalIncome.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right text-red-600">Rs. {summary.totalExpenses.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right text-[var(--text-secondary)]">Rs. {summary.totalBillableExpenses.toLocaleString("en-IN")}</td>
                  <td className={`py-2.5 text-right ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {summary.netProfit >= 0 ? "+" : ""} Rs. {summary.netProfit.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="space-y-1">
              {/* Legend */}
              <div className="flex gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Expenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Net Profit</span>
              </div>
              <BarChart
                data={timeline.map((t) => ({ label: t.period, value: t.income, color: "#22c55e" }))}
                orientation="vertical"
                showValues
                height={220}
              />
              <div className="mt-2">
                <BarChart
                  data={timeline.map((t) => ({ label: t.period, value: t.expenses, color: "#ef4444" }))}
                  orientation="vertical"
                  showValues
                  height={220}
                />
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-[var(--text-secondary)]">No data to display</p>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="space-y-3">
                {expenseByCategory.map((item) => {
                  const pct = summary.totalExpenses > 0 ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                        <span className="font-medium">Rs. {item.amount.toLocaleString("en-IN")} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-[var(--text-secondary)]">No expenses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Income by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Income by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByMethod.length > 0 ? (
              <div className="space-y-3">
                {incomeByMethod.map((item) => {
                  const pct = summary.totalIncome > 0 ? Math.round((item.amount / summary.totalIncome) * 100) : 0;
                  return (
                    <div key={item.method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{METHOD_LABELS[item.method] || item.method}</span>
                        <span className="font-medium">Rs. {item.amount.toLocaleString("en-IN")} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-[var(--text-secondary)]">No income data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
