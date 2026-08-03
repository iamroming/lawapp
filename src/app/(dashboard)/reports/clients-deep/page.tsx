"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { StatsCard } from "@/components/ui/stats-card";
import { Users, TrendingUp, Repeat, IndianRupee } from "lucide-react";

export default function ClientDeepAnalyticsPage() {
  const [ltv, setLtv] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [l, r] = await Promise.all([
        fetch("/api/analytics?type=client_ltv").then(r => r.json()),
        fetch("/api/analytics?type=client_retention").then(r => r.json()),
      ]);
      setLtv(l);
      setRetention(r);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Client Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={ltv?.totalClients?.toString() || "0"} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Avg Client LTV" value={`Rs. ${(ltv?.avgLtv || 0).toLocaleString("en-IN")}`} icon={<IndianRupee className="h-5 w-5" />} />
        <StatsCard title="Retention Rate" value={`${retention?.retentionRate || 0}%`} icon={<Repeat className="h-5 w-5" />}
          description={`${retention?.returning || 0} returning clients`}
          trend={retention?.retentionRate >= 30 ? "up" : "down"} />
        <StatsCard title="One-Time Clients" value={retention?.oneTime?.toString() || "0"} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Client Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Client Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <DonutChart
              data={[
                { label: "Returning Clients", value: retention?.returning || 0, color: "#059669" },
                { label: "One-Time Clients", value: retention?.oneTime || 0, color: "#dc2626" },
              ]}
              size={180}
              centerValue={`${retention?.retentionRate || 0}%`}
              centerLabel="Retention"
            />
            <div className="space-y-3 text-sm">
              <p>Returning clients have engaged your firm for <strong>more than one case</strong>.</p>
              <p>One-time clients have only <strong>one case</strong> on record.</p>
              <p className="text-gray-500">Improving retention by 10% can increase revenue by 25-95%.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients by LTV */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent>
          {ltv?.clients?.length > 0 ? (
            <BarChart
              data={ltv.clients.slice(0, 15).map((c: any) => ({ label: c.name || "Unknown", value: c.totalRevenue }))}
              showValues
            />
          ) : (
            <p className="text-gray-400 text-center py-8">No client data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Client Case Count Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Cases per Client</CardTitle>
        </CardHeader>
        <CardContent>
          {ltv?.clients?.length > 0 ? (
            <BarChart
              data={ltv.clients.slice(0, 20).map((c: any) => ({ label: c.name || "Unknown", value: c.caseCount }))}
              showValues
            />
          ) : (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
