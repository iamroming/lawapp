"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  FileText,
  Loader2,
  ArrowUpRight,
  Plus,
  Scale,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Gavel,
  BookOpen,
  Sparkles,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

const supabase = createClient();

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
  case: { case_number: string; title: string } | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
  invoice: { invoice_number: string } | null;
  client: { full_name: string } | null;
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateFull() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { user: appUser } = useUser();
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
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [caseLimit, setCaseLimit] = useState<{ used: number; limit: number; plan: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!appUser) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, firm_id")
          .eq("id", appUser?.uuid)
          .single();

        const role = profile?.role || "";
        const owner = role === "owner" || role === "partner" || role === "super_admin";
        setIsOwner(owner);
        setUserName(profile?.full_name || appUser?.displayName || appUser?.email?.split("@")[0] || "there");
        setUserRole(role);

        if (!profile?.firm_id) {
          setLoading(false);
          setError("No firm associated with your account. Please contact support.");
          return;
        }
        const firmId = profile.firm_id;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const casesQuery = supabase
          .from("cases")
          .select("id, case_number, title, status, next_hearing_date, total_fee, amount_received, client:clients(full_name)")
          .is("deleted_at", null);
        if (owner) {
          casesQuery.eq("firm_id", firmId);
        } else {
          casesQuery.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
        }

        const clientsQuery = supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null);
        if (owner) {
          clientsQuery.eq("firm_id", firmId);
        } else {
          clientsQuery.eq("created_by", appUser?.uuid);
        }

        const hearingsQuery = supabase
          .from("hearings")
          .select("id, hearing_date, purpose, case:cases(case_number, title)")
          .is("deleted_at", null)
          .gte("hearing_date", now.toISOString())
          .order("hearing_date")
          .limit(10);
        if (owner) {
          hearingsQuery.eq("firm_id", firmId);
        } else {
          hearingsQuery.eq("created_by", appUser?.uuid);
        }

        const paymentsQuery = supabase.from("payments").select("amount");
        if (owner) {
          paymentsQuery.eq("firm_id", firmId);
        } else {
          paymentsQuery.eq("received_by", appUser?.uuid);
        }

        const invoicesQuery = supabase.from("invoices").select("id, amount, tax_amount, status, due_date");
        if (owner) {
          invoicesQuery.eq("firm_id", firmId);
        } else {
          invoicesQuery.eq("issued_by", appUser?.uuid);
        }

        const timeQuery = supabase
          .from("time_entries")
          .select("id, hours, is_billable")
          .gte("date", startOfMonth.toISOString().split("T")[0]);
        if (owner) {
          timeQuery.eq("firm_id", firmId);
        } else {
          timeQuery.eq("lawyer_id", appUser?.uuid);
        }

        const ecourtsQuery = supabase
          .from("ecourts_cases")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        const [casesRes, clientsRes, hearingsRes, paymentsRes, invoicesRes, timeRes] =
          await Promise.all([casesQuery, clientsQuery, hearingsQuery, paymentsQuery, invoicesQuery, timeQuery]);

        // Fetch recent payments for owners
        let recentPaymentsData: RecentPayment[] = [];
        if (owner) {
          const { data: paymentsList } = await supabase
            .from("payments")
            .select("id, amount, payment_method, created_at, invoice:invoices(invoice_number), client:clients(full_name)")
            .eq("firm_id", firmId)
            .order("created_at", { ascending: false })
            .limit(5);
          recentPaymentsData = (paymentsList || []).map((p: any) => ({
            ...p,
            invoice: unwrap(p.invoice),
            client: unwrap(p.client),
          }));
        }
        setRecentPayments(recentPaymentsData);

        const cases = casesRes.data || [];
        const caseIds = cases.map((c: any) => c.id);

        let ecourtsCount = 0;
        if (caseIds.length > 0) {
          const { count } = await supabase
            .from("ecourts_cases")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true)
            .in("case_id", caseIds);
          ecourtsCount = count || 0;
        }
        const activeCases = cases.filter((c: any) => ["active", "in-progress", "under-trial"].includes(c.status));
        const invoices = invoicesRes.data || [];
        const timeEntries = timeRes.data || [];
        const hearings = hearingsRes.data || [];

        const totalRevenue = cases.reduce((sum: number, c: any) => sum + (c.total_fee || 0), 0);
        const totalReceived = cases.reduce((sum: number, c: any) => sum + (c.amount_received || 0), 0);
        const pendingInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "overdue");
        const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
        const totalPending = pendingInvoices.reduce((sum: number, i: any) => sum + (i.amount + (i.tax_amount || 0)), 0);
        const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.amount + (i.tax_amount || 0)), 0);
        const billableHours = timeEntries.filter((t: any) => t.is_billable).reduce((sum: number, t: any) => sum + t.hours, 0);

        const hearingsToday = hearings.filter((h: any) => new Date(h.hearing_date).toDateString() === now.toDateString()).length;
        const hearingsThisWeek = hearings.filter((h: any) => {
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
          ecourtsTracked: ecourtsCount,
        });

        setRecentCases(
          cases.slice(0, 5).map((c: any) => ({ ...c, client: unwrap(c.client) })) as RecentCase[]
        );
        setUpcomingHearings(
          hearings.slice(0, 5).map((h: any) => ({ ...h, case: unwrap(h.case) })) as UpcomingHearing[]
        );

        const alertsQuery = supabase
          .from("case_alert_history")
          .select("id, change_type, change_summary, created_at, case_alerts(case_id, cases(case_number, title))")
          .order("created_at", { ascending: false })
          .limit(3);
        if (owner && caseIds.length > 0) {
          alertsQuery.in("case_alerts.case_id", caseIds);
        }
        const { data: alertsHistory } = await alertsQuery;
        setRecentAlerts(alertsHistory || []);

        // Fetch case limit
        try {
          const limitRes = await fetch("/api/cases/limit-check");
          const limitData = await limitRes.json();
          if (!limitData.error) {
            setCaseLimit({ used: limitData.used, limit: limitData.limit, plan: limitData.plan });
          }
        } catch {}
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const revenuePercent = stats.totalRevenue > 0 ? Math.round((stats.totalReceived / stats.totalRevenue) * 100) : 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] via-[var(--accent-hover)] to-indigo-800 p-6 lg:p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              {getTimeGreeting()}, {userName.split(" ")[0] || "there"}
            </h1>
            <p className="text-white/70 mt-1">{formatDateFull()}</p>
            {isOwner ? (
              <p className="text-white/50 text-sm mt-1">Firm Overview &middot; {userRole === "super_admin" ? "Super Admin" : "Owner"}</p>
            ) : (
              <p className="text-white/50 text-sm mt-1">My Overview &middot; {userRole.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/cases/new">
              <Button className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm">
                <Plus className="h-4 w-4 mr-2" /> New Case
              </Button>
            </Link>
            <Link href="/clients/new">
              <Button className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm">
                <Users className="h-4 w-4 mr-2" /> Add Client
              </Button>
            </Link>
            <Link href="/calendar">
              <Button className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm">
                <Calendar className="h-4 w-4 mr-2" /> Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Case limit exceeded alert */}
      {caseLimit && caseLimit.limit !== -1 && caseLimit.used >= caseLimit.limit && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Case limit reached</p>
              <p className="text-xs text-red-600">
                Your {caseLimit.plan} plan allows {caseLimit.limit} cases. You&apos;ve used all {caseLimit.used}.
                Upgrade to create more cases.
              </p>
            </div>
          </div>
          <a href="/subscription-required" className="text-sm font-semibold text-red-700 hover:text-red-600 whitespace-nowrap">
            Upgrade Plan
          </a>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Link href="/cases" className="group">
          <div className={`relative overflow-hidden rounded-xl bg-white border p-4 lg:p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer ${
            caseLimit && caseLimit.limit !== -1 && caseLimit.used >= caseLimit.limit
              ? "border-red-300"
              : caseLimit && caseLimit.limit !== -1 && caseLimit.used >= caseLimit.limit * 0.8
              ? "border-amber-300"
              : "border-[var(--border)]"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Active Cases</p>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.activeCases}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {stats.totalCases} total
                  {caseLimit && caseLimit.limit !== -1 && (
                    <span className={`ml-1 font-medium ${
                      caseLimit.used >= caseLimit.limit ? "text-red-600" :
                      caseLimit.used >= caseLimit.limit * 0.8 ? "text-amber-600" :
                      ""
                    }`}>
                      ({caseLimit.used}/{caseLimit.limit} limit)
                    </span>
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        <Link href="/clients" className="group">
          <div className="relative overflow-hidden rounded-xl bg-white border border-[var(--border)] p-4 lg:p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Clients</p>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.totalClients}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Total managed</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        <Link href="/calendar" className="group">
          <div className="relative overflow-hidden rounded-xl bg-white border border-[var(--border)] p-4 lg:p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Today&apos;s Hearings</p>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.hearingsToday}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{stats.hearingsThisWeek} this week</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Gavel className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        <Link href="/billing" className="group">
          <div className="relative overflow-hidden rounded-xl bg-white border border-[var(--border)] p-4 lg:p-5 hover:shadow-lg hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mt-1">{formatCurrency(stats.totalReceived)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{revenuePercent}% collected</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <IndianRupee className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "New Case", href: "/cases/new", icon: Briefcase, color: "from-blue-500 to-blue-600" },
          { label: "Add Client", href: "/clients/new", icon: Users, color: "from-violet-500 to-violet-600" },
          { label: "Add Employee", href: "/settings", icon: Users, color: "from-pink-500 to-pink-600" },
          { label: "AI Research", href: "/ai", icon: Sparkles, color: "from-amber-500 to-orange-500" },
          { label: "Court Tracking", href: "/court-tracking", icon: Scale, color: "from-teal-500 to-teal-600" },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 lg:p-4 hover:shadow-md hover:border-[var(--accent)]/20 transition-all duration-200 cursor-pointer">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Hearings - takes 2 cols */}
        <div className="lg:col-span-2">
          <Card className="border-[var(--border)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-base">Upcoming Hearings</CardTitle>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-xs text-[var(--accent)]">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingHearings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-7 w-7 text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">No upcoming hearings</p>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="h-3 w-3 mr-1" /> Schedule Hearing
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingHearings.map((hearing, idx) => {
                    const hearingDate = new Date(hearing.hearing_date);
                    const isToday = hearingDate.toDateString() === new Date().toDateString();
                    const isTomorrow = hearingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    return (
                      <div
                        key={hearing.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                          isToday
                            ? "bg-amber-50 border border-amber-200"
                            : "hover:bg-[var(--surface-subtle)] border border-transparent"
                        }`}
                      >
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--surface-subtle)] to-white border border-[var(--border)] flex flex-col items-center justify-center">
                          <span className="text-[10px] font-semibold text-[var(--accent)] uppercase">
                            {hearingDate.toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                          <span className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                            {hearingDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                              {hearing.case?.title || "Case"}
                            </p>
                            {isToday && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">Today</Badge>}
                            {isTomorrow && <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">Tomorrow</Badge>}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{hearing.case?.case_number}</p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">{hearing.purpose}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">
                            {hearingDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Cards */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card className="border-[var(--border)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Collected</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrency(stats.totalReceived)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
                    style={{ width: `${revenuePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <span>Total: {formatCurrency(stats.totalRevenue)}</span>
                  <span>{revenuePercent}%</span>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Pending</span>
                  <span className="text-sm font-medium text-amber-600">{formatCurrency(stats.pendingPayments)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Overdue</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(stats.overdueInvoices)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Billable Hours</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{stats.billableHours}h</span>
                </div>
              </div>

              <Link href="/billing">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-3.5 w-3.5 mr-2" /> View Billing
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Transactions (owners only) */}
          {isOwner && recentPayments.length > 0 && (
            <Card className="border-[var(--border)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                </div>
                <Link href="/billing/collections">
                  <Button variant="ghost" size="sm" className="text-xs text-[var(--accent)]">
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {payment.client?.full_name || "Client"}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          {payment.invoice?.invoice_number || "Direct"} · {new Date(payment.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 shrink-0 ml-2">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Alerts */}
          {recentAlerts.length > 0 && (
            <Card className="border-[var(--border)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-base">Status Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentAlerts.map((alert: any) => {
                    const caseInfo = alert.case_alerts?.cases;
                    return (
                      <div key={alert.id} className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                        <p className="text-xs font-medium text-[var(--text-primary)]">{caseInfo?.case_number || "Unknown"}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{alert.change_summary}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                          {new Date(alert.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <Link href="/ecourts">
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                    View eCourts <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Cases - Full Width */}
      <Card className="border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-base">{isOwner ? "Recent Cases" : "My Cases"}</CardTitle>
          </div>
          <Link href="/cases">
            <Button variant="ghost" size="sm" className="text-xs text-[var(--accent)]">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-14 w-14 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-7 w-7 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">No cases yet</p>
              <Link href="/cases/new">
                <Button size="sm" className="mt-3">
                  <Plus className="h-3 w-3 mr-1" /> Create First Case
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Case</th>
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Client</th>
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Next Hearing</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="py-3">
                        <Link href={`/cases/${caseItem.id}`} className="group">
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{caseItem.title}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{caseItem.case_number}</p>
                        </Link>
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">{caseItem.client?.full_name || "\u2014"}</td>
                      <td className="py-3">
                        <Badge className={getStatusColor(caseItem.status)}>{caseItem.status}</Badge>
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {caseItem.next_hearing_date
                          ? new Date(caseItem.next_hearing_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                          : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
