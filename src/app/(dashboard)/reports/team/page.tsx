"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { StatsCard } from "@/components/ui/stats-card";
import { Users, Clock, CheckSquare, Scale } from "lucide-react";

export default function TeamAnalyticsPage() {
  const [utilization, setUtilization] = useState<any[]>([]);
  const [taskCompletion, setTaskCompletion] = useState<any[]>([]);
  const [caseLoad, setCaseLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [u, t, c] = await Promise.all([
        fetch("/api/analytics?type=time_utilization").then(r => r.json()),
        fetch("/api/analytics?type=task_completion").then(r => r.json()),
        fetch("/api/analytics?type=case_load_balance").then(r => r.json()),
      ]);
      setUtilization(u);
      setTaskCompletion(t);
      setCaseLoad(c);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading analytics...</div>;

  const totalBillable = utilization.reduce((s, l) => s + l.billable, 0);
  const totalHours = utilization.reduce((s, l) => s + l.total, 0);
  const avgUtilization = totalHours > 0 ? Math.round((totalBillable / totalHours) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Team Size" value={utilization.length.toString()} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Total Hours" value={totalHours.toFixed(1)} icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Avg Utilization" value={`${avgUtilization}%`} icon={<Scale className="h-5 w-5" />}
          description={`${totalBillable.toFixed(1)} billable of ${totalHours.toFixed(1)} total`}
          trend={avgUtilization >= 60 ? "up" : "down"} />
        <StatsCard title="Task Completion" value={
          taskCompletion.length > 0
            ? `${Math.round(taskCompletion.reduce((s, l) => s + l.completionRate, 0) / taskCompletion.length)}%`
            : "N/A"
        } icon={<CheckSquare className="h-5 w-5" />} />
      </div>

      {/* Time Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Time Utilization (Billable vs Non-Billable)</CardTitle>
        </CardHeader>
        <CardContent>
          {utilization.length > 0 ? (
            <div className="space-y-3">
              {utilization.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate text-right">{l.name}</span>
                  <div className="flex-1 flex gap-1 h-6">
                    <div
                      className="bg-blue-500 rounded-l-md flex items-center justify-center"
                      style={{ width: `${l.total > 0 ? (l.billable / l.total) * 100 : 0}%` }}
                    >
                      {l.billable > 0 && <span className="text-xs text-white font-medium">{l.billable.toFixed(1)}h</span>}
                    </div>
                    <div
                      className="bg-[var(--border)] rounded-r-md flex items-center justify-center"
                      style={{ width: `${l.total > 0 ? (l.nonBillable / l.total) * 100 : 0}%` }}
                    >
                      {l.nonBillable > 0 && <span className="text-xs text-[var(--text-secondary)] font-medium">{l.nonBillable.toFixed(1)}h</span>}
                    </div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{l.utilizationRate}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-tertiary)] text-center py-8">No time entries yet</p>
          )}
          <div className="flex gap-4 mt-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded" /> Billable</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[var(--border)] rounded" /> Non-Billable</span>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {taskCompletion.length > 0 ? (
            <BarChart
              data={taskCompletion.map(l => ({ label: l.name, value: l.completionRate }))}
              showValues
            />
          ) : (
            <p className="text-[var(--text-tertiary)] text-center py-8">No tasks yet</p>
          )}
        </CardContent>
      </Card>

      {/* Case Load Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Case Load Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {caseLoad?.lawyers?.length > 0 ? (
            <>
              <BarChart
                data={caseLoad.lawyers.map((l: any) => ({ label: l.name, value: l.count }))}
                showValues
              />
              <div className="mt-4 p-3 bg-[var(--background)] rounded-lg text-sm">
                <p>Average: <strong>{caseLoad.avg}</strong> cases per lawyer</p>
                <p>Std Deviation: <strong>{caseLoad.stdDev}</strong> — {caseLoad.balanced ? "Balanced" : "Unbalanced"} distribution</p>
              </div>
            </>
          ) : (
            <p className="text-[var(--text-tertiary)] text-center py-8">No active cases</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
