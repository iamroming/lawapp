"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { formatDate } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  Clock,
  ArrowLeft,
  FileDown,
  UserPlus,
  UserCheck,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface ClientByMonth {
  month: string;
  count: number;
}

interface ClientByType {
  type: string;
  count: number;
}

interface TopClient {
  name: string;
  caseCount: number;
  totalPaid: number;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  clientsByMonth: ClientByMonth[];
  clientsByType: ClientByType[];
  topClients: TopClient[];
  clientsWithContact: { withPhone: number; withEmail: number };
}

const dateRangeOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export default function ClientReportPage() {
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    newThisMonth: 0,
    clientsByMonth: [],
    clientsByType: [],
    topClients: [],
    clientsWithContact: { withPhone: 0, withEmail: 0 },
  });
  const [dateRange, setDateRange] = useState("this-year");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchClientStats();
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

  const fetchClientStats = async () => {
    setLoading(true);
    try {
      const startDate = getDateFilter();
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", user.id)
        .single();
      if (profileError || !profile) throw new Error("Profile not found");

      const isOwner = ["owner", "partner", "super_admin"].includes(profile.role);

      let clientsQuery = supabase
        .from("clients")
        .select("id, full_name, email, phone, client_type, created_at, deleted_at");

      if (!isOwner) {
        clientsQuery = clientsQuery.eq("created_by", user.id);
      }

      const { data: clients, error: clientsError } = await clientsQuery;
      if (clientsError) throw clientsError;

      const allClients = (clients || []).filter((c) => !c.deleted_at);
      const totalClients = allClients.length;

      const activeClients = allClients.filter((c) => {
        const created = new Date(c.created_at);
        return created >= new Date(startDate);
      }).length;

      const newThisMonth = allClients.filter((c) => {
        const created = new Date(c.created_at);
        return created >= new Date(thisMonthStart);
      }).length;

      const monthMap: Record<string, number> = {};
      allClients.forEach((c) => {
        const month = new Date(c.created_at).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      const typeMap: Record<string, number> = {};
      allClients.forEach((c) => {
        const type = c.client_type || "Individual";
        typeMap[type] = (typeMap[type] || 0) + 1;
      });

      const withPhone = allClients.filter((c) => c.phone && c.phone.trim() !== "").length;
      const withEmail = allClients.filter((c) => c.email && c.email.trim() !== "").length;

      // Get top clients by case count
      let casesQuery = supabase
        .from("cases")
        .select("client_id, created_by")
        .is("deleted_at", null);

      if (!isOwner) {
        casesQuery = casesQuery.eq("created_by", user.id);
      }

      const { data: casesData } = await casesQuery;

      const caseCountMap: Record<string, number> = {};
      (casesData || []).forEach((c) => {
        if (c.client_id) {
          caseCountMap[c.client_id] = (caseCountMap[c.client_id] || 0) + 1;
        }
      });

      // Get payments per client
      let paymentsQuery = supabase
        .from("payments")
        .select("client_id, amount, received_by");

      if (!isOwner) {
        paymentsQuery = paymentsQuery.eq("received_by", user.id);
      }

      const { data: paymentsData } = await paymentsQuery;

      const paymentMap: Record<string, number> = {};
      (paymentsData || []).forEach((p) => {
        if (p.client_id) {
          paymentMap[p.client_id] = (paymentMap[p.client_id] || 0) + (p.amount || 0);
        }
      });

      const topClients: TopClient[] = allClients
        .map((c) => ({
          name: c.full_name,
          caseCount: caseCountMap[c.id] || 0,
          totalPaid: paymentMap[c.id] || 0,
        }))
        .sort((a, b) => b.caseCount - a.caseCount)
        .slice(0, 10);

      setStats({
        totalClients,
        activeClients,
        newThisMonth,
        clientsByMonth: Object.entries(monthMap)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
          }),
        clientsByType: Object.entries(typeMap)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        topClients,
        clientsWithContact: { withPhone, withEmail },
      });
    } catch (error) {
      console.error("Error fetching client stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxMonthCount = Math.max(...stats.clientsByMonth.map((m) => m.count), 1);
  const maxTypeCount = Math.max(...stats.clientsByType.map((t) => t.count), 1);
  const maxCaseCount = Math.max(...stats.topClients.map((c) => c.caseCount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading client statistics...</div>
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
            <h1 className="text-2xl font-bold">Client Report</h1>
            <p className="text-gray-500">Client acquisition and engagement metrics</p>
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
          title="Total Clients"
          value={stats.totalClients}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Clients"
          value={stats.activeClients}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatsCard
          title="With Phone"
          value={stats.clientsWithContact.withPhone}
          icon={<Phone className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.clientsByMonth.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data available</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {stats.clientsByMonth.map((item) => {
                  const height = maxMonthCount > 0 ? (item.count / maxMonthCount) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{item.count}</span>
                      <div
                        className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600 min-h-[4px]"
                        style={{ height: `${height}%` }}
                        title={`${item.month}: ${item.count} clients`}
                      />
                      <span className="text-xs text-gray-500 truncate w-full text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.clientsByType.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.clientsByType.map((item) => {
                  const percentage = (item.count / maxTypeCount) * 100;
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.type}</span>
                        <span className="text-gray-500">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
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

        {/* Top Clients */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Clients by Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topClients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No client data available</p>
            ) : (
              <div className="space-y-3">
                {stats.topClients.map((item) => {
                  const percentage = (item.caseCount / maxCaseCount) * 100;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-4 text-gray-500">
                          <span>{item.caseCount} case{item.caseCount !== 1 ? "s" : ""}</span>
                          <span>₹{item.totalPaid.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
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
