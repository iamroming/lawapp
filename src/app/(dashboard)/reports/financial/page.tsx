"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { StatsCard } from "@/components/ui/stats-card";
import { Receipt, Wallet, TrendingUp as TrendingUpIcon } from "lucide-react";

export default function FinancialAnalyticsPage() {
  const [forecast, setForecast] = useState<any>(null);
  const [profitByType, setProfitByType] = useState<any[]>([]);
  const [expenseRatio, setExpenseRatio] = useState<any[]>([]);
  const [revenuePerLawyer, setRevenuePerLawyer] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [f, p, e, r, pm] = await Promise.all([
        fetch("/api/analytics?type=revenue_forecast").then(r => r.json()),
        fetch("/api/analytics?type=profit_by_case_type").then(r => r.json()),
        fetch("/api/analytics?type=expense_ratio").then(r => r.json()),
        fetch("/api/analytics?type=revenue_per_lawyer").then(r => r.json()),
        fetch("/api/analytics?type=payment_methods").then(r => r.json()),
      ]);
      setForecast(f);
      setProfitByType(p);
      setExpenseRatio(e);
      setRevenuePerLawyer(r);
      setPaymentMethods(pm);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financial Analytics</h1>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatsCard title="Avg Monthly Revenue" value={`Rs. ${(forecast?.avgMonthly || 0).toLocaleString("en-IN")}`} />
            <StatsCard title="Trend" value={forecast?.trend === "up" ? "Growing" : forecast?.trend === "down" ? "Declining" : "Stable"}
              description={forecast?.trend === "up" ? "Revenue is trending upward" : "Revenue is stable"}
              trend={forecast?.trend === "up" ? "up" : forecast?.trend === "down" ? "down" : "neutral"} />
            <StatsCard title="Next 3 Months" value={`Rs. ${(forecast?.forecast || []).reduce((s: number, f: any) => s + f.predicted, 0).toLocaleString("en-IN")}`} description="Predicted total" />
          </div>
          {forecast?.historical && (
            <LineChart
              data={forecast.historical.map((h: any) => ({ label: h.month, value: h.actual }))}
              forecast={forecast.forecast?.map((f: any) => ({ label: f.month, value: f.predicted }))}
              height={250}
            />
          )}
        </CardContent>
      </Card>

      {/* Profit by Case Type */}
      <Card>
        <CardHeader>
          <CardTitle>Profit by Case Type</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={profitByType.map((p: any) => ({ label: p.type, value: p.profit, color: p.profit >= 0 ? "#059669" : "#dc2626" }))}
            showValues
          />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {profitByType.slice(0, 4).map((p: any) => (
              <div key={p.type} className="p-3 bg-[var(--background)] rounded-lg">
                <p className="text-[var(--text-secondary)] text-xs">{p.type}</p>
                <p className="font-bold">Rs. {p.profit.toLocaleString("en-IN")}</p>
                <p className={`text-xs ${p.margin >= 50 ? "text-green-600" : p.margin >= 20 ? "text-yellow-600" : "text-red-600"}`}>
                  {p.margin}% margin
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense to Revenue Ratio */}
      <Card>
        <CardHeader>
          <CardTitle>Expense to Revenue Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseRatio.length > 0 ? (
            <LineChart
              data={expenseRatio.map((e: any) => ({ label: e.month, value: e.ratio }))}
              color="#059669"
              height={200}
            />
          ) : (
            <p className="text-[var(--text-tertiary)] text-center py-8">No expense data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Revenue per Lawyer */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue per Lawyer</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={revenuePerLawyer.map((l: any) => ({ label: l.name, value: l.revenue }))}
            showValues
          />
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={paymentMethods.map((p: any) => ({ label: p.method, value: p.count }))}
            showValues
          />
        </CardContent>
      </Card>
    </div>
  );
}
