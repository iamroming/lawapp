"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  Clock,
  ArrowLeft,
  FileDown,
  BarChart3,
  Award,
  Users,
} from "lucide-react";
import Link from "next/link";

interface LawyerPerformance {
  name: string;
  casesWon: number;
  casesLost: number;
  casesSettled: number;
  totalCases: number;
  winRate: number;
  revenue: number;
}

interface PerformanceStats {
  overallWinRate: number;
  avgCaseDuration: number;
  totalResolved: number;
  casesByLawyer: LawyerPerformance[];
  monthlyResolution: { month: string; count: number }[];
  casesByPriority: { priority: string; count: number }[];
}

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const priorityColors: Record<string, string> = {
  low: "bg-[var(--border)] text-[var(--text-primary)]",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function PerformanceReportPage() {
  const [stats, setStats] = useState<PerformanceStats>({
    overallWinRate: 0,
    avgCaseDuration: 0,
    totalResolved: 0,
    casesByLawyer: [],
    monthlyResolution: [],
    casesByPriority: [],
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPerformanceStats();
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

  const fetchPerformanceStats = async () => {
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

      let casesQuery = supabase
        .from("cases")
        .select("id, status, priority, created_at, assigned_to, created_by")
        .gte("created_at", startDate);

      if (!isOwner) {
        casesQuery = casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
      }

      const { data: cases, error: casesError } = await casesQuery;
      if (casesError) throw casesError;

      const allCases = cases || [];

      // Get all firm members
      const { data: members } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["owner", "partner", "associate", "intern"]);

      const memberMap: Record<string, string> = {};
      (members || []).forEach((m) => {
        memberMap[m.id] = m.full_name;
      });

      // Calculate win rate
      const resolvedCases = allCases.filter((c) =>
        ["won", "lost", "settled", "dismissed"].includes(c.status)
      );
      const wonCases = resolvedCases.filter((c) => c.status === "won").length;
      const overallWinRate = resolvedCases.length > 0
        ? Math.round((wonCases / resolvedCases.length) * 100)
        : 0;

      // Calculate average case duration
      const avgCaseDuration = allCases.length > 0
        ? Math.round(
            allCases.reduce((sum, c) => {
              const created = new Date(c.created_at).getTime();
              const now = Date.now();
              return sum + (now - created) / (1000 * 60 * 60 * 24);
            }, 0) / allCases.length
          )
        : 0;

      // Performance by lawyer
      const lawyerMap: Record<string, LawyerPerformance> = {};
      allCases.forEach((c) => {
        const lawyerId = c.assigned_to || c.created_by;
        if (!lawyerId) return;

        if (!lawyerMap[lawyerId]) {
          lawyerMap[lawyerId] = {
            name: memberMap[lawyerId] || "Unknown",
            casesWon: 0,
            casesLost: 0,
            casesSettled: 0,
            totalCases: 0,
            winRate: 0,
            revenue: 0,
          };
        }

        lawyerMap[lawyerId].totalCases++;
        if (c.status === "won") lawyerMap[lawyerId].casesWon++;
        if (c.status === "lost") lawyerMap[lawyerId].casesLost++;
        if (c.status === "settled") lawyerMap[lawyerId].casesSettled++;
      });

      // Calculate win rates
      Object.values(lawyerMap).forEach((lawyer) => {
        const resolved = lawyer.casesWon + lawyer.casesLost + lawyer.casesSettled;
        lawyer.winRate = resolved > 0 ? Math.round((lawyer.casesWon / resolved) * 100) : 0;
      });

      // Get revenue per lawyer
      let paymentsQuery = supabase
        .from("payments")
        .select("received_by, amount")
        .gte("payment_date", startDate);

      if (!isOwner) {
        paymentsQuery = paymentsQuery.eq("received_by", user.id);
      }

      const { data: payments } = await paymentsQuery;

      (payments || []).forEach((p) => {
        if (p.received_by && lawyerMap[p.received_by]) {
          lawyerMap[p.received_by].revenue += p.amount || 0;
        }
      });

      const casesByLawyer = Object.values(lawyerMap)
        .sort((a, b) => b.totalCases - a.totalCases)
        .slice(0, 10);

      // Monthly resolution
      const monthMap: Record<string, number> = {};
      resolvedCases.forEach((c) => {
        const month = new Date(c.created_at).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      const monthlyResolution = Object.entries(monthMap)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // Cases by priority
      const priorityMap: Record<string, number> = {};
      allCases.forEach((c) => {
        const priority = c.priority || "medium";
        priorityMap[priority] = (priorityMap[priority] || 0) + 1;
      });

      const casesByPriority = Object.entries(priorityMap)
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        overallWinRate,
        avgCaseDuration,
        totalResolved: resolvedCases.length,
        casesByLawyer,
        monthlyResolution,
        casesByPriority,
      });
    } catch (error) {
      console.error("Error fetching performance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxResolution = Math.max(...stats.monthlyResolution.map((m) => m.count), 1);
  const maxLawyerCases = Math.max(...stats.casesByLawyer.map((l) => l.totalCases), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading performance metrics...</div>
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
            <h1 className="text-2xl font-bold">Performance Metrics</h1>
            <p className="text-[var(--text-secondary)]">Win rate, case duration, and productivity</p>
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
          title="Win Rate"
          value={`${stats.overallWinRate}%`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatsCard
          title="Avg. Case Duration"
          value={`${stats.avgCaseDuration} days`}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Resolved"
          value={stats.totalResolved}
          icon={<Award className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Lawyers"
          value={stats.casesByLawyer.length}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lawyer Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance by Lawyer</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByLawyer.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No lawyer data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-[var(--text-secondary)]">Lawyer</th>
                      <th className="text-center py-2 font-medium text-[var(--text-secondary)]">Total</th>
                      <th className="text-center py-2 font-medium text-[var(--text-secondary)]">Won</th>
                      <th className="text-center py-2 font-medium text-[var(--text-secondary)]">Lost</th>
                      <th className="text-center py-2 font-medium text-[var(--text-secondary)]">Settled</th>
                      <th className="text-center py-2 font-medium text-[var(--text-secondary)]">Win Rate</th>
                      <th className="text-right py-2 font-medium text-[var(--text-secondary)]">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.casesByLawyer.map((lawyer) => (
                      <tr key={lawyer.name} className="border-b hover:bg-[var(--surface-subtle)]">
                        <td className="py-3 font-medium">{lawyer.name}</td>
                        <td className="py-3 text-center">{lawyer.totalCases}</td>
                        <td className="py-3 text-center text-green-600">{lawyer.casesWon}</td>
                        <td className="py-3 text-center text-red-600">{lawyer.casesLost}</td>
                        <td className="py-3 text-center text-[var(--text-accent)]">{lawyer.casesSettled}</td>
                        <td className="py-3 text-center">
                          <Badge className={lawyer.winRate >= 50 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {lawyer.winRate}%
                          </Badge>
                        </td>
                        <td className="py-3 text-right">{formatCurrency(lawyer.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Resolution Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Case Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyResolution.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {stats.monthlyResolution.map((item) => {
                  const height = maxResolution > 0 ? (item.count / maxResolution) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-[var(--text-secondary)]">{item.count}</span>
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 min-h-[4px]"
                        style={{ height: `${height}%` }}
                        title={`${item.month}: ${item.count} resolved`}
                      />
                      <span className="text-xs text-[var(--text-secondary)] truncate w-full text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cases by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByPriority.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.casesByPriority.map((item) => {
                  const total = stats.casesByPriority.reduce((sum, p) => sum + p.count, 0);
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;
                  return (
                    <div key={item.priority} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={priorityColors[item.priority] || "bg-[var(--border)] text-[var(--text-primary)]"}>
                          {item.priority}
                        </Badge>
                        <span className="text-[var(--text-secondary)]">{item.count} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-3">
                        <div
                          className="bg-indigo-500 h-3 rounded-full transition-all"
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
