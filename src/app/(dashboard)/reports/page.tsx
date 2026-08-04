"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart3,
  IndianRupee,
  Users,
  Calendar,
  TrendingUp,
  FileDown,
  Briefcase,
  Clock,
  Target,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  totalRevenue: number;
  pendingPayments: number;
  upcomingHearings: number;
  casesByStatus: Record<string, number>;
  monthlyRevenue: { month: string; amount: number }[];
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    upcomingHearings: 0,
    casesByStatus: {},
    monthlyRevenue: [],
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-3-months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    return startDate.toISOString();
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDate = getDateFilter();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", user.id)
        .single();
      if (profileError || !profile) throw new Error("Profile not found");

      const isOwner = ["owner", "partner", "super_admin"].includes(profile.role);
      const firmId = profile.firm_id || user.id;

      let casesQuery = supabase
        .from("cases")
        .select("id, status, case_type, created_at")
        .gte("created_at", startDate);

      let clientsQuery = supabase
        .from("clients")
        .select("id", { count: "exact", head: true });

      let paymentsQuery = supabase
        .from("payments")
        .select("id, amount, payment_date")
        .gte("payment_date", startDate);

      let hearingsQuery = supabase
        .from("hearings")
        .select("id")
        .gte("hearing_date", new Date().toISOString());

      if (isOwner) {
        casesQuery = casesQuery.eq("firm_id", firmId);
        clientsQuery = clientsQuery.eq("firm_id", firmId);
        paymentsQuery = paymentsQuery.eq("firm_id", firmId);
        hearingsQuery = hearingsQuery.eq("firm_id", firmId);
      } else {
        casesQuery = casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
        clientsQuery = clientsQuery.eq("created_by", user.id);
        paymentsQuery = paymentsQuery.eq("received_by", user.id);
        hearingsQuery = hearingsQuery.eq("created_by", user.id);
      }

      const [casesRes, clientsRes, paymentsRes, hearingsRes] = await Promise.all([
        casesQuery,
        clientsQuery,
        paymentsQuery,
        hearingsQuery,
      ]);

      if (casesRes.error) throw casesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const cases = casesRes.data || [];
      const payments = paymentsRes.data || [];

      const casesByStatus: Record<string, number> = {};
      cases.forEach((c) => {
        casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
      });

      const monthlyRevenue: Record<string, number> = {};
      payments.forEach((p) => {
        const month = new Date(p.payment_date).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
      });

      setStats({
        totalCases: cases.length,
        activeCases: cases.filter((c) =>
          ["active", "in-progress", "under-trial"].includes(c.status)
        ).length,
        totalClients: clientsRes.count || 0,
        totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingPayments: 0,
        upcomingHearings: hearingsRes.data?.length || 0,
        casesByStatus,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month,
          amount,
        })),
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Cases", stats.totalCases],
      ["Active Cases", stats.activeCases],
      ["Total Clients", stats.totalClients],
      ["Total Revenue", stats.totalRevenue],
      ["Upcoming Hearings", stats.upcomingHearings],
      ["", ""],
      ["Status", "Count"],
      ...Object.entries(stats.casesByStatus).map(([status, count]) => [status, count]),
      ["", ""],
      ["Month", "Revenue"],
      ...stats.monthlyRevenue.map((m) => [m.month, m.amount]),
    ];
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.amount), 1);

  const reportCards = [
    {
      title: "Case Statistics",
      description: "Overview of cases by status, type, and court",
      icon: <Briefcase className="h-6 w-6" />,
      href: "/reports/cases",
      color: "bg-[var(--surface-subtle)] text-[var(--text-accent)]",
    },
    {
      title: "Revenue Report",
      description: "Monthly revenue trends and payment analytics",
      icon: <IndianRupee className="h-6 w-6" />,
      href: "/reports/revenue",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Client Report",
      description: "Client acquisition and engagement metrics",
      icon: <Users className="h-6 w-6" />,
      href: "/reports/clients",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Hearing Schedule",
      description: "Upcoming hearings and court schedule",
      icon: <Calendar className="h-6 w-6" />,
      href: "/calendar",
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Performance Metrics",
      description: "Win rate, case duration, and productivity",
      icon: <Target className="h-6 w-6" />,
      href: "/reports/performance",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-[var(--text-secondary)]">Comprehensive insights into your practice</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48"
          />
          <Button variant="outline" onClick={() => window.print()} className="text-sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportCSV} className="text-sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Cases"
          value={stats.totalCases}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Cases"
          value={stats.activeCases}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatsCard
          title="Upcoming Hearings"
          value={stats.upcomingHearings}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((card) => (
          <Link key={card.title} href={card.href} onClick={card.href === "#" ? (e) => { e.preventDefault(); toast("Coming soon!"); } : undefined}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>{card.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{card.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.casesByStatus).length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.casesByStatus)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const percentage = stats.totalCases > 0 ? (count / stats.totalCases) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{status.replace("-", " ")}</span>
                          <span className="text-[var(--text-secondary)]">{count}</span>
                        </div>
                        <div className="w-full bg-[var(--border)] rounded-full h-2">
                          <div
                            className="bg-[var(--text-accent)] h-2 rounded-full transition-all"
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

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.monthlyRevenue.map((item) => {
                  const percentage = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                  return (
                    <div key={item.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.month}</span>
                        <span className="text-[var(--text-secondary)]">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
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
      </div>
    </div>
  );
}
