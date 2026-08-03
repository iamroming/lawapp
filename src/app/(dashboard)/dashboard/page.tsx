"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency, getStatusColor, unwrap } from "@/lib/utils";
import {
  Briefcase,
  Users,
  Calendar,
  IndianRupee,
  Clock,
  Globe,
  FileText,
  Loader2,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(); // BUG #9 fix: create outside component to avoid infinite re-render

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  upcomingHearings: number;
  pendingPayments: number;
  totalRevenue: number;
  totalReceived: number;
  overdueInvoices: number;
  billableHours: number;
  hearingsToday: number;
  hearingsThisWeek: number;
  ecourtsTracked: number;
}

interface RecentCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  next_hearing_date: string | null;
  client: { full_name: string } | null;
}

interface UpcomingHearing {
  id: string;
  hearing_date: string;
  purpose: string;
  case: {
    case_number: string;
    title: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    upcomingHearings: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalReceived: 0,
    overdueInvoices: 0,
    billableHours: 0,
    hearingsToday: 0,
    hearingsThisWeek: 0,
    ecourtsTracked: 0,
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<UpcomingHearing[]>([]);
  const [causeList, setCauseList] = useState<any[]>([]);
  const [loadingCauseList, setLoadingCauseList] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, firm_id")
          .eq("id", user.id)
          .single();

        const role = profile?.role || "";
        const owner = role === "owner" || role === "partner" || role === "super_admin";
        setIsOwner(owner);
        setUserName(profile?.full_name || user.email || "");

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // For employees, filter by assigned_to or created_by
        const casesQuery = supabase
          .from("cases")
          .select("id, case_number, title, status, next_hearing_date, total_fee, amount_received, client:clients(full_name)")
          .is("deleted_at", null);
        if (!owner) {
          casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
        }

        const clientsQuery = supabase
          .from("clients")
          .select("id", { count: "exact", head: true });
        if (!owner) {
          clientsQuery.eq("created_by", user.id);
        }

        const hearingsQuery = supabase
          .from("hearings")
          .select("id, hearing_date, purpose, case:cases(case_number, title)")
          .gte("hearing_date", now.toISOString())
          .order("hearing_date")
          .limit(10);
        if (!owner) {
          hearingsQuery.eq("created_by", user.id);
        }

        const paymentsQuery = supabase.from("payments").select("amount");
        if (!owner) {
          paymentsQuery.eq("received_by", user.id);
        }

        const invoicesQuery = supabase.from("invoices").select("id, amount, tax_amount, status, due_date");
        if (!owner) {
          invoicesQuery.eq("issued_by", user.id);
        }

        const timeQuery = supabase
          .from("time_entries")
          .select("id, hours, is_billable")
          .gte("date", startOfMonth.toISOString().split("T")[0]);
        if (!owner) {
          timeQuery.eq("lawyer_id", user.id);
        }

        const ecourtsQuery = supabase
          .from("ecourts_cases")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        const [casesRes, clientsRes, hearingsRes, paymentsRes, invoicesRes, timeRes, ecourtsRes] = await Promise.all([
          casesQuery,
          clientsQuery,
          hearingsQuery,
          paymentsQuery,
          invoicesQuery,
          timeQuery,
          ecourtsQuery,
        ]);

        const cases = casesRes.data || [];
        const activeCases = cases.filter((c) => ["active", "in-progress", "under-trial"].includes(c.status));
        const invoices = invoicesRes.data || [];
        const timeEntries = timeRes.data || [];
        const hearings = hearingsRes.data || [];

        const totalRevenue = cases.reduce((sum, c) => sum + (c.total_fee || 0), 0);
        const totalReceived = cases.reduce((sum, c) => sum + (c.amount_received || 0), 0);
        const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
        const overdueInvoices = invoices.filter((i) => i.status === "overdue");
        const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);
        const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount + (i.tax_amount || 0)), 0);
        const billableHours = timeEntries.filter((t) => t.is_billable).reduce((sum, t) => sum + t.hours, 0);

        const hearingsToday = hearings.filter((h) => {
          const d = new Date(h.hearing_date);
          return d.toDateString() === now.toDateString();
        }).length;

        const hearingsThisWeek = hearings.filter((h) => {
          const d = new Date(h.hearing_date);
          return d >= todayStart && d <= weekEnd;
        }).length;

        setStats({
          totalCases: cases.length,
          activeCases: activeCases.length,
          totalClients: clientsRes.count || 0,
          upcomingHearings: hearings.length,
          pendingPayments: totalPending,
          totalRevenue,
          totalReceived,
          overdueInvoices: totalOverdue,
          billableHours,
          hearingsToday,
          hearingsThisWeek,
          ecourtsTracked: ecourtsRes.count || 0,
        });

        const recentCasesData = cases.slice(0, 5).map((c) => ({
          ...c,
          client: unwrap(c.client),
        }));
        setRecentCases(recentCasesData as RecentCase[]);

        const hearingsData = hearings.slice(0, 5).map((h) => ({
          ...h,
          case: unwrap(h.case),
        }));
        setUpcomingHearings(hearingsData as UpcomingHearing[]);

        // Fetch cause list for courts linked to the firm
        setLoadingCauseList(true);
        try {
          const { data: courtLinks } = await supabase
            .from("court_case_links")
            .select("court_code")
            .eq("auto_fetch", true)
            .limit(5);

          if (courtLinks && courtLinks.length > 0) {
            const today = new Date();
            const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
            const uniqueCourts = [...new Set(courtLinks.map((cl) => cl.court_code))];
            const allCauseList: any[] = [];

            for (const courtCode of uniqueCourts.slice(0, 2)) {
              try {
                const res = await fetch(`/api/courts/hc/cause-list?court_code=${courtCode}&causelist_date=${dateStr}`);
                const data = await res.json();
                if (!data.error && Array.isArray(data)) {
                  allCauseList.push(...data.map((item: any) => ({ ...item, court: courtCode })));
                }
              } catch (e) {
                console.error(`Failed to fetch cause list for ${courtCode}:`, e);
              }
            }
            setCauseList(allCauseList.slice(0, 10));
          }
        } catch (e) {
          console.error("Error fetching cause list:", e);
        }
        setLoadingCauseList(false);

        // Fetch recent alert activity
        const { data: alertsHistory } = await supabase
          .from("case_alert_history")
          .select("id, change_type, change_summary, created_at, case_alerts(case_id, cases(case_number, title))")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentAlerts(alertsHistory || []);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isOwner ? "Firm Dashboard" : `Welcome, ${userName}`}
        </h1>
        <p className="text-gray-500">
          {isOwner ? "Overview of your firm's practice" : "Here's your work overview"}
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Cases"
          value={stats.activeCases}
          icon={<Briefcase className="h-5 w-5" />}
          trend={stats.totalCases > 0 ? "neutral" : undefined}
          trendValue={stats.totalCases > 0 ? `${Math.round((stats.activeCases / stats.totalCases) * 100)}% of total` : undefined}
        />
        <StatsCard
          title="My Clients"
          value={stats.totalClients}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Hearings Today"
          value={stats.hearingsToday}
          icon={<Calendar className="h-5 w-5" />}
          trend={stats.hearingsThisWeek > 0 ? "neutral" : undefined}
          trendValue={stats.hearingsThisWeek > 0 ? `${stats.hearingsThisWeek} this week` : undefined}
        />
        <StatsCard
          title="Revenue Collected"
          value={formatCurrency(stats.totalReceived)}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={stats.totalRevenue > 0 ? "up" : undefined}
          trendValue={stats.totalRevenue > 0 ? `${Math.round((stats.totalReceived / stats.totalRevenue) * 100)}% collected` : undefined}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Pending Payments</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(stats.pendingPayments)}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Billable Hours</p>
                <p className="text-xl font-bold text-blue-900">{stats.billableHours}h</p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Overdue</p>
                <p className="text-xl font-bold text-red-900">{formatCurrency(stats.overdueInvoices)}</p>
              </div>
              <IndianRupee className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{isOwner ? "Recent Cases" : "My Cases"}</CardTitle>
            <Link href="/cases">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No cases yet. Create your first case!</p>
            ) : (
              <div className="space-y-3">
                {recentCases.map((caseItem) => (
                  <div key={caseItem.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{caseItem.title}</p>
                      <p className="text-xs text-gray-500">{caseItem.case_number}</p>
                      {caseItem.client && (
                        <p className="text-xs text-gray-400">{caseItem.client.full_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                      {caseItem.next_hearing_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(caseItem.next_hearing_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Hearings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Hearings</CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">View Calendar</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingHearings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming hearings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingHearings.map((hearing) => (
                  <div key={hearing.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {new Date(hearing.hearing_date).toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {new Date(hearing.hearing_date).getDate()}
                      </span>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium text-sm">{hearing.case?.title}</p>
                      <p className="text-xs text-gray-500">{hearing.case?.case_number}</p>
                      <p className="text-xs text-gray-500">{hearing.purpose}</p>
                    </div>
                    {new Date(hearing.hearing_date).toDateString() === new Date().toDateString() && (
                      <Badge className="bg-red-100 text-red-800">Today</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Cause List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Today's Cause List</CardTitle>
            <Link href="/research">
              <Button variant="ghost" size="sm">Court Research</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingCauseList ? (
              <p className="text-gray-500 text-center py-4">Loading cause list...</p>
            ) : causeList.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No cause list available. Link cases to eCourts to auto-fetch daily cause lists.
              </p>
            ) : (
              <div className="space-y-2">
                {causeList.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border text-sm hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">{item.case_number || item.serial_number}</p>
                      <p className="text-xs text-gray-500">{item.petitioner} vs {item.respondent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-600">{item.court_name || item.court?.toUpperCase()}</p>
                      {item.bench && <p className="text-xs text-gray-400">{item.bench}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Status Alerts */}
        {recentAlerts.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Status Alerts</CardTitle>
              <Link href="/ecourts">
                <Button variant="ghost" size="sm">eCourts Tracking</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAlerts.map((alert: any) => {
                  const caseInfo = alert.case_alerts?.cases;
                  return (
                    <div key={alert.id} className="flex items-center justify-between p-2 rounded border text-sm hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{caseInfo?.case_number || "Unknown Case"}</p>
                        <p className="text-xs text-gray-500">{alert.change_summary}</p>
                      </div>
                      <p className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/cases/new">
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </Link>
            <Link href="/clients/new">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Hearing
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
