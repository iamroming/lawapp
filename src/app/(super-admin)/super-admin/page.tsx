"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminStats } from "@/app/actions/super-admin";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Crown,
  Users,
  Briefcase,
  Receipt,
  IndianRupee,
  UserPlus,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface PlatformStats {
  totalUsers: number;
  totalCases: number;
  totalClients: number;
  totalRevenue: number;
  activeSubscriptions: number;
  recentSignups: { id: string; full_name: string; email: string; role: string; created_at: string }[];
  recentCases: { id: string; title: string; case_number: string; status: string; created_at: string }[];
  subscriptionBreakdown: { status: string; count: number }[];
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCases: 0,
    totalClients: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    recentSignups: [],
    recentCases: [],
    subscriptionBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
      try {
        const data = await getSuperAdminStats();
        setStats(data);
      } catch {
        // Error fetching data — stats remain at defaults
      }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-[var(--text-secondary)]">Complete overview of the entire platform</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="ml-auto p-2 rounded-lg border hover:bg-[var(--surface-subtle)] transition-colors" title="Refresh data">
          <svg className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Total Cases" value={stats.totalCases} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Total Clients" value={stats.totalClients} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Active Subs" value={stats.activeSubscriptions} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Recent Signups
            </CardTitle>
            <Link href="/super-admin/users" className="text-sm text-[var(--text-accent)] hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {stats.recentSignups.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentSignups.map((u) => (
                  <Link key={u.id} href={`/super-admin/users/${u.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-[var(--surface-subtle)]">
                    <div>
                      <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>{u.role}</Badge>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{formatDate(u.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              Recent Cases
            </CardTitle>
            <Link href="/super-admin/cases" className="text-sm text-[var(--text-accent)] hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {stats.recentCases.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No cases yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{c.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{c.case_number}</p>
                    </div>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-500" />
            Subscription Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats.subscriptionBreakdown.length === 0 ? (
              <p className="text-[var(--text-secondary)]">No subscriptions yet.</p>
            ) : (
              stats.subscriptionBreakdown.map((item) => (
                <div key={item.status} className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-[var(--background)]">
                  <Badge
                    variant={
                      item.status === "active" ? "success" :
                      item.status === "cancelled" || item.status === "expired" ? "destructive" : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/super-admin/users" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-[var(--surface-subtle)] hover:border-blue-200 transition-colors">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">All Users</span>
            </Link>
            <Link href="/super-admin/cases" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-colors">
              <Briefcase className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">All Cases</span>
            </Link>
            <Link href="/super-admin/revenue" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-green-50 hover:border-green-200 transition-colors">
              <IndianRupee className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Revenue</span>
            </Link>
            <Link href="/super-admin/settings" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-orange-50 hover:border-orange-200 transition-colors">
              <Settings className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
