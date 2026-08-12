"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import {
  Users,
  Receipt,
  TrendingUp,
  Briefcase,
  AlertCircle,
  IndianRupee,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface FirmStats {
  totalEmployees: number;
  totalClients: number;
  activeCases: number;
  totalRevenue: number;
  employees: { id: string; full_name: string; email: string; role: string; created_at: string }[];
  recentClients: { id: string; full_name: string; email: string; status: string; created_at: string }[];
  roleDistribution: { role: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { user: appUser } = useUser();
  const [stats, setStats] = useState<FirmStats>({
    totalEmployees: 0,
    totalClients: 0,
    activeCases: 0,
    totalRevenue: 0,
    employees: [],
    recentClients: [],
    roleDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      if (!appUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid)
        .single();

      const currentFirmId = profile?.firm_id;
      setFirmId(currentFirmId);

      if (!currentFirmId) {
        setLoading(false);
        return;
      }

      const [employeesRes, clientsRes, casesRes, paymentsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role, created_at")
          .eq("firm_id", currentFirmId)
          .order("created_at", { ascending: false }),
        supabase
          .from("clients")
          .select("id, full_name, email, status, created_at")
          .eq("firm_id", currentFirmId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("cases")
          .select("id, status")
          .eq("firm_id", currentFirmId),
        supabase
          .from("payments")
          .select("amount")
          .eq("firm_id", currentFirmId),
      ]);

      const employees = employeesRes.data || [];
      const cases = casesRes.data || [];
      const activeCases = cases.filter((c: any) => c.status === "open" || c.status === "in_progress");

      const roleCount: Record<string, number> = {};
      employees.forEach((e: any) => {
        roleCount[e.role || "unknown"] = (roleCount[e.role || "unknown"] || 0) + 1;
      });

      setStats({
        totalEmployees: employees.length,
        totalClients: clientsRes.data?.length || 0,
        activeCases: activeCases.length,
        totalRevenue: (paymentsRes.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        employees: employees.slice(0, 5) as FirmStats["employees"],
        recentClients: (clientsRes.data || []) as FirmStats["recentClients"],
        roleDistribution: Object.entries(roleCount).map(([role, count]) => ({ role, count })),
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading owner dashboard...</div>;
  }

  if (!firmId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Firm Found</h2>
        <p className="text-[var(--text-secondary)]">You don&apos;t have a firm assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Firm Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Overview of your firm&apos;s data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
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
          icon={<Receipt className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Employees</CardTitle>
            <Link href="/admin/employees" className="text-sm text-[var(--text-accent)] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {stats.employees.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No employees yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{emp.full_name || "Unnamed"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{emp.email}</p>
                    </div>
                    <Badge variant="secondary">{emp.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Clients</CardTitle>
            <Link href="/admin/users" className="text-sm text-[var(--text-accent)] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentClients.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-4">No clients yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{client.full_name || "Unnamed"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{client.email}</p>
                    </div>
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {stats.roleDistribution.length === 0 ? (
              <p className="text-[var(--text-secondary)]">No roles configured.</p>
            ) : (
              stats.roleDistribution.map((item) => (
                <div
                  key={item.role}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                >
                  <Badge variant="secondary">{item.role}</Badge>
                  <span className="text-lg font-bold">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/salary">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Salary Management</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Manage employee salaries, payments & settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/salary-settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--surface-accent)] rounded-lg">
                  <Settings className="h-6 w-6 text-[var(--text-accent)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Role Salary Settings</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Set default salary & profit share per role</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
