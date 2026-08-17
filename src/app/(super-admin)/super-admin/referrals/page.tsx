"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Gift,
  TrendingUp,
  CheckCircle,
  Clock,
  Share2,
  Award,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: string;
  referrer_reward_days: number;
  referred_reward_days: number;
  referrer_rewarded: boolean;
  referred_rewarded: boolean;
  source: string;
  created_at: string;
  referrer: { full_name: string; email: string; referral_code: string } | null;
  referred: { full_name: string; email: string } | null;
}

interface ReferrerStat {
  name: string;
  email: string;
  count: number;
  converted: number;
}

interface Stats {
  total: number;
  pending: number;
  signedUp: number;
  trialStarted: number;
  converted: number;
  rewarded: number;
  conversionRate: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  signed_up: "bg-blue-100 text-blue-700",
  trial_started: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  rewarded: "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  signed_up: "Signed Up",
  trial_started: "Trial Started",
  converted: "Converted",
  rewarded: "Rewarded",
};

export default function ReferralsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/referrals");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setReferrals(data.referrals);
        setTopReferrers(data.topReferrers);
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.referrer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.referrer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referred?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.referred?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-amber-500" />
            Referral Program
          </h1>
          <p className="text-gray-600">Track referrals and rewards</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Users className="h-6 w-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
          <p className="text-sm text-gray-600">Total Referrals</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Clock className="h-6 w-6 text-gray-400 mb-2" />
          <p className="text-2xl font-bold">{stats?.pending || 0}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Share2 className="h-6 w-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.signedUp || 0}</p>
          <p className="text-sm text-gray-600">Signed Up</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.trialStarted || 0}</p>
          <p className="text-sm text-gray-600">Trial Started</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.converted || 0}</p>
          <p className="text-sm text-gray-600">Converted</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Gift className="h-6 w-6 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.rewarded || 0}</p>
          <p className="text-sm text-gray-600">Rewarded</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Award className="h-6 w-6 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
          <p className="text-sm text-gray-600">Conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Funnel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Referral Funnel</h2>
          <div className="space-y-3">
            {[
              { label: "Total Links Shared", value: stats?.total || 0, color: "bg-gray-500", width: "100%" },
              { label: "Signed Up", value: stats?.signedUp || 0, color: "bg-blue-500", width: `${((stats?.signedUp || 0) / Math.max(stats?.total || 1, 1)) * 100}%` },
              { label: "Trial Started", value: stats?.trialStarted || 0, color: "bg-purple-500", width: `${((stats?.trialStarted || 0) / Math.max(stats?.total || 1, 1)) * 100}%` },
              { label: "Converted (Paid)", value: stats?.converted || 0, color: "bg-green-500", width: `${((stats?.converted || 0) / Math.max(stats?.total || 1, 1)) * 100}%` },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{step.label}</span>
                  <span className="font-medium">{step.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full`} style={{ width: step.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Top Referrers</h2>
          {topReferrers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No referrals yet</p>
          ) : (
            <div className="space-y-3">
              {topReferrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-gray-500">{r.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{r.count}</p>
                    <p className="text-xs text-green-600">{r.converted} converted</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">How Referral Program Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Share Link", desc: "User shares their unique referral link" },
            { step: "2", title: "Friend Signs Up", desc: "New user creates account with referral code" },
            { step: "3", title: "Starts Trial", desc: "New user starts 14-day free trial" },
            { step: "4", title: "Both Rewarded", desc: "Both get 1 month free when friend pays" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="signed_up">Signed Up</option>
          <option value="trial_started">Trial Started</option>
          <option value="converted">Converted</option>
          <option value="rewarded">Rewarded</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Referrals ({filteredReferrals.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Referrer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Referred User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No referrals found
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{r.referrer?.full_name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{r.referrer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{r.referral_code}</code>
                    </td>
                    <td className="px-4 py-3">
                      {r.referred ? (
                        <>
                          <p className="font-medium text-sm">{r.referred.full_name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{r.referred.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{r.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{new Date(r.created_at).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
