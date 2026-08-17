"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency } from "@/lib/utils";
import {
  IndianRupee,
  Users,
  Calendar,
  TrendingUp,
  FileDown,
  Briefcase,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
];

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  totalRevenue: number;
  upcomingHearings: number;
  casesByStatus: Record<string, number>;
  monthlyRevenue: { month: string; amount: number }[];
}

export default function ReportsOverviewTab() {
  const { user: appUser } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    totalRevenue: 0,
    upcomingHearings: 0,
    casesByStatus: {},
    monthlyRevenue: [],
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (appUser) {
      fetchReportData();
    }
  }, [dateRange, appUser]);

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
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    return startDate.toISOString();
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDate = getDateFilter();
      if (!appUser) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", appUser?.uuid)
        .single();
      if (!profile) throw new Error("Profile not found");

      const isOwner = ["owner", "partner", "super_admin"].includes(profile.role);
      const firmId = profile.firm_id || appUser?.uuid;

      let casesQuery = supabase.from("cases").select("id, status, created_at").gte("created_at", startDate);
      let clientsQuery = supabase.from("clients").select("id", { count: "exact", head: true });
      let paymentsQuery = supabase.from("payments").select("id, amount, payment_date").gte("payment_date", startDate);
      let hearingsQuery = supabase.from("hearings").select("id").gte("hearing_date", new Date().toISOString());

      if (isOwner) {
        casesQuery = casesQuery.eq("firm_id", firmId);
        clientsQuery = clientsQuery.eq("firm_id", firmId);
        paymentsQuery = paymentsQuery.eq("firm_id", firmId);
        hearingsQuery = hearingsQuery.eq("firm_id", firmId);
      } else {
        casesQuery = casesQuery.eq("firm_id", firmId).or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
        clientsQuery = clientsQuery.eq("firm_id", firmId).eq("created_by", appUser?.uuid);
        paymentsQuery = paymentsQuery.eq("firm_id", firmId).eq("received_by", appUser?.uuid);
        hearingsQuery = hearingsQuery.eq("firm_id", firmId).eq("created_by", appUser?.uuid);
      }

      const [casesRes, clientsRes, paymentsRes, hearingsRes] = await Promise.all([
        casesQuery, clientsQuery, paymentsQuery, hearingsQuery,
      ]);

      if (casesRes.error) throw casesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (hearingsRes.error) throw hearingsRes.error;

      const cases = (casesRes.data || []) as any[];
      const payments = (paymentsRes.data || []) as any[];

      const casesByStatus: Record<string, number> = {};
      cases.forEach((c: any) => {
        casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
      });

      const monthlyRevenue: Record<string, number> = {};
      payments.forEach((p: any) => {
        const month = new Date(p.payment_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
      });

      setStats({
        totalCases: cases.length,
        activeCases: cases.filter((c: any) => ["active", "in-progress", "under-trial"].includes(c.status)).length,
        totalClients: clientsRes.count || 0,
        totalRevenue: payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        upcomingHearings: hearingsRes.data?.length || 0,
        casesByStatus,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
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
        <div className="flex flex-wrap gap-2">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48"
          />
          <Button variant="outline" onClick={exportCSV} className="text-sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Cases" value={stats.totalCases} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Active Cases" value={stats.activeCases} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
        <StatsCard title="Upcoming Hearings" value={stats.upcomingHearings} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <div className="bg-[var(--text-accent)] h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

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
                        <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
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
