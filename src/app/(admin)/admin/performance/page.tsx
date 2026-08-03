"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Award,
} from "lucide-react";

interface EmployeePerformance {
  id: string;
  full_name: string;
  email: string;
  role: string;
  clients_acquired: number;
  cases_handled: number;
  active_cases: number;
  won_cases: number;
}

export default function PerformancePage() {
  const [performance, setPerformance] = useState<EmployeePerformance[]>([]);
  const [totals, setTotals] = useState({ clients: 0, cases: 0, active: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      const fid = profile?.firm_id;
      setFirmId(fid);

      if (fid) {
        await fetchPerformance(fid);
      }
    };
    init();
  }, [supabase]);

  const fetchPerformance = async (fid: string) => {
    setLoading(true);

    const { data: employees } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("firm_id", fid);

    if (!employees) {
      setLoading(false);
      return;
    }

    const empIds = employees.map((e) => e.id);

    const [clientsRes, casesRes, activeCasesRes, wonCasesRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .in("created_by", empIds)
        .is("deleted_at", null),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .or(`assigned_to.in.(${empIds.join(",")}),created_by.in.(${empIds.join(",")})`)
        .is("deleted_at", null),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .or(`assigned_to.in.(${empIds.join(",")}),created_by.in.(${empIds.join(",")})`)
        .in("status", ["active", "in-progress", "pending"])
        .is("deleted_at", null),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .or(`assigned_to.in.(${empIds.join(",")}),created_by.in.(${empIds.join(",")})`)
        .eq("status", "won")
        .is("deleted_at", null),
    ]);

    const totalClients = clientsRes.count || 0;
    const totalCases = casesRes.count || 0;
    const totalActive = activeCasesRes.count || 0;
    const totalWon = wonCasesRes.count || 0;

    // Per-employee breakdown
    const perfData: EmployeePerformance[] = [];

    for (const emp of employees) {
      const [empClientsRes, empCasesRes, empActiveRes, empWonRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("created_by", emp.id)
          .is("deleted_at", null),
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .or(`assigned_to.eq.${emp.id},created_by.eq.${emp.id}`)
          .is("deleted_at", null),
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .or(`assigned_to.eq.${emp.id},created_by.eq.${emp.id}`)
          .in("status", ["active", "in-progress", "pending"])
          .is("deleted_at", null),
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .or(`assigned_to.eq.${emp.id},created_by.eq.${emp.id}`)
          .eq("status", "won")
          .is("deleted_at", null),
      ]);

      perfData.push({
        id: emp.id,
        full_name: emp.full_name || "Unnamed",
        email: emp.email || "",
        role: emp.role || "unknown",
        clients_acquired: empClientsRes.count || 0,
        cases_handled: empCasesRes.count || 0,
        active_cases: empActiveRes.count || 0,
        won_cases: empWonRes.count || 0,
      });
    }

    perfData.sort((a, b) => b.clients_acquired - a.clients_acquired);

    setTotals({ clients: totalClients, cases: totalCases, active: totalActive, won: totalWon });
    setPerformance(perfData);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Performance</h1>
        <p className="text-gray-500">Track your team&apos;s performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={performance.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Clients Acquired"
          value={totals.clients}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatsCard
          title="Cases Handled"
          value={totals.cases}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Cases Won"
          value={totals.won}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-sm">#</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Clients</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Cases</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Active</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Won</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No employee data available.
                    </td>
                  </tr>
                ) : (
                  performance.map((emp, idx) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">
                              {emp.full_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{emp.full_name}</p>
                            <p className="text-xs text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{emp.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-lg">{emp.clients_acquired}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-lg">{emp.cases_handled}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={emp.active_cases > 0 ? "default" : "outline"}>
                          {emp.active_cases}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={emp.won_cases > 0 ? "success" : "outline"}>
                          {emp.won_cases}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
