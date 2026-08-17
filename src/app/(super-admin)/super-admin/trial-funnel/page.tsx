"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";

interface TrialUser {
  id: string;
  user_id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  stage: string;
  daysSinceStart: number;
  users: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
  };
  plan: {
    name: string;
    slug: string;
    price: number;
  };
}

interface TrialStats {
  totalTrials: number;
  activeTrials: number;
  converted: number;
  expired: number;
  byStage: {
    welcome: number;
    day3: number;
    day7: number;
    day12: number;
    day14: number;
  };
  messagesSent: {
    total: number;
    welcome: number;
    day3: number;
    day7: number;
    day12: number;
    day14: number;
  };
  conversionRate: string;
}

interface LogEntry {
  id: string;
  user_id: string;
  message_type: string;
  status: string;
  sent_at: string;
  error_message: string;
}

export default function TrialFunnelPage() {
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [trials, setTrials] = useState<TrialUser[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/trial-funnel");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTrials(data.trials);
        setLogs(data.recentLogs);
      }
    } catch (error) {
      console.error("Failed to fetch trial funnel data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualTrigger = async () => {
    setSending(true);
    try {
      await fetch("/api/subscriptions/trial-funnel", { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Failed to trigger funnel:", error);
    } finally {
      setSending(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Phone", "Plan", "Status", "Stage", "Days", "Started", "Expires"].join(","),
      ...trials.map((t) =>
        [
          t.users?.full_name || "",
          t.users?.email || "",
          t.users?.phone || "",
          t.plan?.name || "",
          t.status,
          t.stage,
          t.daysSinceStart,
          new Date(t.starts_at).toLocaleDateString(),
          t.expires_at ? new Date(t.expires_at).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-funnel-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredTrials = filter === "all" ? trials : trials.filter((t) => t.stage === filter);

  const stageColors: Record<string, string> = {
    welcome: "bg-blue-100 text-blue-800",
    day3: "bg-purple-100 text-purple-800",
    day7: "bg-yellow-100 text-yellow-800",
    day12: "bg-orange-100 text-orange-800",
    day14: "bg-red-100 text-red-800",
    converted: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-800",
  };

  const stageLabels: Record<string, string> = {
    welcome: "Welcome",
    day3: "Day 3",
    day7: "Day 7",
    day12: "Day 12",
    day14: "Day 14",
    converted: "Converted",
    expired: "Expired",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Funnel Monitor</h1>
          <p className="text-gray-600">Track automated trial emails & WhatsApp messages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleManualTrigger}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Run Funnel Now"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Trials</p>
              <p className="text-2xl font-bold">{stats?.totalTrials || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-gray-600">Active Trials</p>
              <p className="text-2xl font-bold">{stats?.activeTrials || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Converted</p>
              <p className="text-2xl font-bold">{stats?.converted || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold">{stats?.expired || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Conversion</p>
              <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Funnel Stages</h2>
        <div className="grid grid-cols-5 gap-4">
          {["welcome", "day3", "day7", "day12", "day14"].map((stage) => (
            <div key={stage} className="text-center">
              <div className={`p-4 rounded-lg ${stageColors[stage]}`}>
                <p className="text-3xl font-bold">{stats?.byStage[stage as keyof typeof stats.byStage] || 0}</p>
                <p className="text-sm mt-1">{stageLabels[stage]}</p>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 inline mr-1" />
                {stats?.messagesSent[stage as keyof typeof stats.messagesSent] || 0} sent
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Stages</option>
          <option value="welcome">Welcome</option>
          <option value="day3">Day 3</option>
          <option value="day7">Day 7</option>
          <option value="day12">Day 12</option>
          <option value="day14">Day 14</option>
          <option value="converted">Converted</option>
          <option value="expired">Expired</option>
        </select>
        <span className="text-sm text-gray-600">{filteredTrials.length} users</span>
      </div>

      {/* Trials Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stage</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Days</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Started</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTrials.map((trial) => (
              <tr key={trial.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{trial.users?.full_name || "N/A"}</p>
                    <p className="text-sm text-gray-600">{trial.users?.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{trial.plan?.name || "N/A"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[trial.stage]}`}>
                    {stageLabels[trial.stage]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{trial.daysSinceStart}/14</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{new Date(trial.starts_at).toLocaleDateString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">
                    {trial.expires_at ? new Date(trial.expires_at).toLocaleDateString() : "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Message Logs</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sent At</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="text-sm font-medium">{log.message_type.replace("trial_funnel_", "")}</span>
                  </td>
                  <td className="px-4 py-2">
                    {log.status === "sent" ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" /> Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="h-4 w-4" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-gray-600">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-red-600">{log.error_message || ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
