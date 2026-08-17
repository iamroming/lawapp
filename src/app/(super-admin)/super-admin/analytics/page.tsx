"use client";
import React, { useEffect, useState } from "react";
import { getSiteAnalytics } from "@/app/actions/analytics";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  MousePointerClick,
  Monitor,
  Globe,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

type Period = "today" | "7d" | "30d" | "90d" | "all";

interface AnalyticsData {
  totalVisitors: number;
  totalPageviews: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { page: string; views: number }[];
  topReferrers: { referrer: string; visits: number }[];
  deviceBreakdown: { device: string; count: number }[];
  browserBreakdown: { browser: string; count: number }[];
  trafficChart: { date: string; visitors: number; pageviews: number }[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function extractDomain(url: string): string {
  try {
    if (url.startsWith("/")) return "Direct";
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getMaxValue(data: { visitors: number; pageviews: number }[]): number {
  return Math.max(...data.map((d) => Math.max(d.visitors, d.pageviews)), 1);
}

export default function SuperAdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (p: Period) => {
    setPeriod(p);
    setLoading(true);
    try {
      const result = await getSiteAnalytics({ period: p });
      setData(result);
    } catch {
      // Error loading analytics
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics(period);
    setRefreshing(false);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const maxChartValue = getMaxValue(data.trafficChart);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Site Analytics</h1>
            <p className="text-[var(--text-secondary)]">Visitor tracking and traffic insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1 w-fit">
        {(["today", "7d", "30d", "90d", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => fetchAnalytics(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === p
                ? "bg-purple-500 text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
            }`}
          >
            {p === "today" ? "Today" : p === "all" ? "All Time" : p}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Visitors" value={data.totalVisitors} icon={<Users className="h-5 w-5" />} description="Unique sessions" />
        <StatsCard title="Pageviews" value={data.totalPageviews} icon={<Eye className="h-5 w-5" />} description="Total pages viewed" />
        <StatsCard title="Avg. Session" value={formatDuration(data.avgSessionDuration)} icon={<Clock className="h-5 w-5" />} description="Time on site" />
        <StatsCard title="Bounce Rate" value={`${data.bounceRate}%`} icon={<MousePointerClick className="h-5 w-5" />} description="Single-page visits" />
        <StatsCard title="Total Sessions" value={data.totalSessions} icon={<ArrowUpRight className="h-5 w-5" />} description="All sessions" />
      </div>

      {/* Traffic Chart */}
      {data.trafficChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {data.trafficChart.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.visitors} visitors, ${d.pageviews} pageviews`}>
                  <div className="w-full flex gap-px items-end" style={{ height: "120px" }}>
                    <div
                      className="flex-1 bg-purple-400 rounded-t-sm"
                      style={{ height: `${(d.visitors / maxChartValue) * 100}%`, minHeight: "2px" }}
                    />
                    <div
                      className="flex-1 bg-purple-200 rounded-t-sm"
                      style={{ height: `${(d.pageviews / maxChartValue) * 100}%`, minHeight: "2px" }}
                    />
                  </div>
                  {data.trafficChart.length <= 15 && (
                    <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-full">
                      {d.date.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-400 rounded-sm" />
                Visitors
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-200 rounded-sm" />
                Pageviews
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No page data yet</p>
            ) : (
              <div className="space-y-2">
                {data.topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-[70%]">{p.page}</span>
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">{p.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No referrer data yet</p>
            ) : (
              <div className="space-y-2">
                {data.topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <span className="text-sm text-[var(--text-primary)] truncate max-w-[70%]">{extractDomain(r.referrer)}</span>
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">{r.visits.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No device data yet</p>
            ) : (
              <div className="space-y-3">
                {data.deviceBreakdown.map((d, i) => {
                  const total = data.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{d.device}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{pct}%</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Browsers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.browserBreakdown.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No browser data yet</p>
            ) : (
              <div className="space-y-3">
                {data.browserBreakdown.map((b, i) => {
                  const total = data.browserBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{b.browser}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{pct}%</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
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
