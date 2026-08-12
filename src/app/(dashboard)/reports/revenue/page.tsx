"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  ArrowLeft,
  FileDown,
  Receipt,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface RevenueByClient {
  clientName: string;
  amount: number;
}

interface RevenueByType {
  type: string;
  amount: number;
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueByClient: RevenueByClient[];
  revenueByType: RevenueByType[];
  outstandingAmount: number;
  gstCollected: number;
  pendingInvoices: number;
}

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export default function RevenueReportPage() {
  const { user: appUser } = useUser();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: [],
    revenueByClient: [],
    revenueByType: [],
    outstandingAmount: 0,
    gstCollected: 0,
    pendingInvoices: 0,
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchRevenueStats();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "this-month":
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case "last-3-months":
        return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      case "this-year":
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(2020, 0, 1).toISOString();
    }
  };

  const fetchRevenueStats = async () => {
    setLoading(true);
    try {
      const startDate = getDateFilter();

      if (!appUser) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", appUser?.uuid)
        .single();
      if (profileError || !profile) throw new Error("Profile not found");

      const isOwner = ["owner", "partner", "super_admin"].includes(profile.role);

      let paymentsQuery = supabase
        .from("payments")
        .select("id, amount, payment_date, client:clients(full_name), case:cases(case_type)")
        .gte("payment_date", startDate);

      let invoicesQuery = supabase
        .from("invoices")
        .select("id, amount, status, tax_amount")
        .gte("created_at", startDate);

      if (!isOwner) {
        paymentsQuery = paymentsQuery.eq("received_by", appUser?.uuid);
        invoicesQuery = invoicesQuery.eq("issued_by", appUser?.uuid);
      }

      const [paymentsRes, invoicesRes] = await Promise.all([
        paymentsQuery,
        invoicesQuery,
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      const payments = paymentsRes.data || [];
      const invoices = invoicesRes.data || [];

      const monthlyRevenue: Record<string, number> = {};
      payments.forEach((p) => {
        const month = new Date(p.payment_date).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
      });

      const clientRevenue: Record<string, number> = {};
      payments.forEach((p) => {
        const clientArr = p.client as any;
        const clientName = unwrap(clientArr)?.full_name || "Unknown";
        clientRevenue[clientName] = (clientRevenue[clientName] || 0) + (p.amount || 0);
      });

      const typeRevenue: Record<string, number> = {};
      payments.forEach((p) => {
        const caseArr = p.case as any;
        const caseData = unwrap(caseArr);
        const type = caseData?.case_type || caseData?.type || "Other";
        typeRevenue[type] = (typeRevenue[type] || 0) + (p.amount || 0);
      });

      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const outstandingAmount = invoices
        .filter((i) => i.status === "sent" || i.status === "overdue")
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      const gstCollected = invoices.reduce((sum, i) => sum + (i.tax_amount || 0), 0);
      const pendingInvoices = invoices.filter(
        (i) => i.status === "sent" || i.status === "overdue"
      ).length;

      setStats({
        totalRevenue,
        monthlyRevenue: Object.entries(monthlyRevenue)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
          }),
        revenueByClient: Object.entries(clientRevenue)
          .map(([clientName, amount]) => ({ clientName, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10),
        revenueByType: Object.entries(typeRevenue)
          .map(([type, amount]) => ({ type, amount }))
          .sort((a, b) => b.amount - a.amount),
        outstandingAmount,
        gstCollected,
        pendingInvoices,
      });
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxMonthly = Math.max(...stats.monthlyRevenue.map((m) => m.amount), 1);
  const maxClient = Math.max(...stats.revenueByClient.map((c) => c.amount), 1);
  const maxType = Math.max(...stats.revenueByType.map((t) => t.amount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading revenue report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Revenue Report</h1>
            <p className="text-[var(--text-secondary)]">Financial insights and payment analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingAmount)}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatsCard
          title="GST Collected"
          value={formatCurrency(stats.gstCollected)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatsCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.monthlyRevenue.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">No revenue data available</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2 h-48">
                {stats.monthlyRevenue.map((item) => {
                  const height = maxMonthly > 0 ? (item.amount / maxMonthly) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-secondary)]">{formatCurrency(item.amount)}</span>
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 min-h-[4px]"
                        style={{ height: `${height}%` }}
                        title={`${item.month}: ${formatCurrency(item.amount)}`}
                      />
                      <span className="text-xs text-[var(--text-secondary)] truncate w-full text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Client</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByClient.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.revenueByClient.map((item) => {
                  const percentage = (item.amount / maxClient) * 100;
                  return (
                    <div key={item.clientName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.clientName}</span>
                        <span className="text-[var(--text-secondary)] ml-2">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Case Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Case Type</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByType.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.revenueByType.map((item) => {
                  const percentage = (item.amount / maxType) * 100;
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.type}</span>
                        <span className="text-[var(--text-secondary)]">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outstanding Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(stats.outstandingAmount)}
              </p>
              <p className="text-[var(--text-secondary)] mt-2">
                {stats.pendingInvoices} pending invoice{stats.pendingInvoices !== 1 ? "s" : ""}
              </p>
              <Link href="/billing">
                <Button className="mt-4" variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* GST Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GST Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">Total GST Collected</span>
                <span className="font-semibold">{formatCurrency(stats.gstCollected)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">CGST (9%)</span>
                <span className="font-semibold">{formatCurrency(stats.gstCollected / 2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">SGST (9%)</span>
                <span className="font-semibold">{formatCurrency(stats.gstCollected / 2)}</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-2">
                * For intra-state transactions. IGST applicable for inter-state.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
