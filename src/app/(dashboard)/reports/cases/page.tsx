"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { getStatusColor } from "@/lib/utils";
import {
  Briefcase,
  TrendingUp,
  Clock,
  Target,
  ArrowLeft,
  FileDown,
} from "lucide-react";
import Link from "next/link";

interface CaseByStatus {
  status: string;
  count: number;
}

interface CaseByType {
  type: string;
  count: number;
}

interface CaseByCourt {
  court: string;
  count: number;
}

interface WinLossData {
  won: number;
  lost: number;
  settled: number;
  dismissed: number;
  total: number;
}

interface CaseStats {
  totalCases: number;
  casesByStatus: CaseByStatus[];
  casesByType: CaseByType[];
  casesByCourt: CaseByCourt[];
  winLoss: WinLossData;
  avgDuration: number;
}

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-400",
  active: "bg-blue-400",
  "in-progress": "bg-purple-400",
  "under-trial": "bg-orange-400",
  won: "bg-green-400",
  lost: "bg-red-400",
  settled: "bg-emerald-400",
  closed: "bg-gray-400",
  adjourned: "bg-indigo-400",
  dismissed: "bg-rose-400",
};

export default function CaseStatisticsPage() {
  const [stats, setStats] = useState<CaseStats>({
    totalCases: 0,
    casesByStatus: [],
    casesByType: [],
    casesByCourt: [],
    winLoss: { won: 0, lost: 0, settled: 0, dismissed: 0, total: 0 },
    avgDuration: 0,
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCaseStats();
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

  const fetchCaseStats = async () => {
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

      let query = supabase
        .from("cases")
        .select("id, status, case_type, court, created_at, next_hearing_date")
        .gte("created_at", startDate);

      if (!["owner", "partner", "super_admin"].includes(profile.role)) {
        query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
      }

      const { data: cases, error: casesError } = await query;
      if (casesError) throw casesError;

      const allCases = cases || [];

      const statusMap: Record<string, number> = {};
      allCases.forEach((c) => {
        statusMap[c.status] = (statusMap[c.status] || 0) + 1;
      });

      const typeMap: Record<string, number> = {};
      allCases.forEach((c) => {
        const type = c.case_type || "Other";
        typeMap[type] = (typeMap[type] || 0) + 1;
      });

      const courtMap: Record<string, number> = {};
      allCases.forEach((c) => {
        const court = c.court || "Unknown";
        courtMap[court] = (courtMap[court] || 0) + 1;
      });

      const resolvedCases = allCases.filter((c) =>
        ["won", "lost", "settled", "dismissed"].includes(c.status)
      );
      const winLoss: WinLossData = {
        won: resolvedCases.filter((c) => c.status === "won").length,
        lost: resolvedCases.filter((c) => c.status === "lost").length,
        settled: resolvedCases.filter((c) => c.status === "settled").length,
        dismissed: resolvedCases.filter((c) => c.status === "dismissed").length,
        total: resolvedCases.length,
      };

      const avgDuration =
        allCases.length > 0
          ? allCases.reduce((sum, c) => {
              const created = new Date(c.created_at).getTime();
              const now = Date.now();
              return sum + (now - created) / (1000 * 60 * 60 * 24);
            }, 0) / allCases.length
          : 0;

      setStats({
        totalCases: allCases.length,
        casesByStatus: Object.entries(statusMap)
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count),
        casesByType: Object.entries(typeMap)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        casesByCourt: Object.entries(courtMap)
          .map(([court, count]) => ({ court, count }))
          .sort((a, b) => b.count - a.count),
        winLoss,
        avgDuration: Math.round(avgDuration),
      });
    } catch (error) {
      console.error("Error fetching case stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxStatusCount = Math.max(...stats.casesByStatus.map((s) => s.count), 1);
  const maxTypeCount = Math.max(...stats.casesByType.map((t) => t.count), 1);
  const maxCourtCount = Math.max(...stats.casesByCourt.map((c) => c.count), 1);

  const winRate =
    stats.winLoss.total > 0
      ? Math.round((stats.winLoss.won / stats.winLoss.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading case statistics...</div>
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
            <h1 className="text-2xl font-bold">Case Statistics Report</h1>
            <p className="text-[var(--text-secondary)]">Detailed breakdown of your cases</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Cases"
          value={stats.totalCases}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatsCard
          title="Win Rate"
          value={`${winRate}%`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatsCard
          title="Avg. Duration"
          value={`${stats.avgDuration} days`}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Resolved Cases"
          value={stats.winLoss.total}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status - Pie Chart using CSS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByStatus.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-4">
                {/* CSS Pie Chart */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {(() => {
                        let cumulative = 0;
                        const total = stats.casesByStatus.reduce((sum, s) => sum + s.count, 0);
                        return stats.casesByStatus.map((item) => {
                          const percentage = total > 0 ? (item.count / total) * 100 : 0;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = -cumulative;
                          cumulative += percentage;
                          const colorClass = statusColors[item.status] || "bg-gray-400";
                          const color = colorClass.replace("bg-", "#").replace("-400", "");
                          const colorMap: Record<string, string> = {
                            yellow: "#facc15",
                            blue: "#60a5fa",
                            purple: "#c084fc",
                            orange: "#fb923c",
                            green: "#4ade80",
                            red: "#f87171",
                            emerald: "#34d399",
                            gray: "#9ca3af",
                            indigo: "#818cf8",
                            rose: "#fb7185",
                          };
                          const fillColor = colorMap[color] || "#9ca3af";
                          return (
                            <circle
                              key={item.status}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={fillColor}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-500"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{stats.totalCases}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Total</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2">
                  {stats.casesByStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-3 h-3 rounded-full ${statusColors[item.status] || "bg-gray-400"}`}
                      />
                      <span className="capitalize">{item.status.replace("-", " ")}</span>
                      <span className="text-[var(--text-secondary)] ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win/Loss Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Win/Loss Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.winLoss.total === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No resolved cases yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {(() => {
                        const segments = [
                          { label: "Won", count: stats.winLoss.won, color: "#4ade80" },
                          { label: "Lost", count: stats.winLoss.lost, color: "#f87171" },
                          { label: "Settled", count: stats.winLoss.settled, color: "#60a5fa" },
                          { label: "Dismissed", count: stats.winLoss.dismissed, color: "#9ca3af" },
                        ].filter((s) => s.count > 0);
                        let cumulative = 0;
                        return segments.map((seg) => {
                          const percentage = (seg.count / stats.winLoss.total) * 100;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = -cumulative;
                          cumulative += percentage;
                          return (
                            <circle
                              key={seg.label}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-500"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{winRate}%</p>
                        <p className="text-xs text-[var(--text-secondary)]">Win Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-sm">Won: {stats.winLoss.won}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-sm">Lost: {stats.winLoss.lost}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-subtle)]">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-sm">Settled: {stats.winLoss.settled}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background)]">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Dismissed: {stats.winLoss.dismissed}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cases by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByType.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.casesByType.map((item) => {
                  const percentage = (item.count / maxTypeCount) * 100;
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.type}</span>
                        <span className="text-[var(--text-secondary)]">{item.count}</span>
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

        {/* Cases by Court */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cases by Court</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByCourt.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.casesByCourt.map((item) => {
                  const percentage = (item.count / maxCourtCount) * 100;
                  return (
                    <div key={item.court} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.court}</span>
                        <span className="text-[var(--text-secondary)]">{item.count}</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-3">
                        <div
                          className="bg-orange-500 h-3 rounded-full transition-all"
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
