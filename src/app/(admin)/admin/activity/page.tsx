"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatDate, unwrap } from "@/lib/utils";
import {
  Activity,
  Search,
  Filter,
  LogIn,
  Plus,
  Edit,
  Trash2,
  FileText,
  Clock,
  CreditCard,
  User,
  Briefcase,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
  user: { id: string; full_name: string; email: string } | null;
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  signup: <User className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  upload: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  signup: "bg-green-100 text-green-700",
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
  view: "bg-gray-100 text-gray-700",
  upload: "bg-purple-100 text-purple-700",
  payment: "bg-indigo-100 text-indigo-700",
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, user:profiles(id, full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);

    const formatted = (data || []).map((log: any) => ({
      ...log,
      user: unwrap(log.user),
    }));

    setLogs(formatted as ActivityLog[]);
    setLoading(false);
  };

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
  const uniqueEntities = [...new Set(logs.map((l) => l.entity_type).filter(Boolean))].sort();

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((l) => new Date(l.created_at) >= today);
  const uniqueUsersToday = new Set(todayLogs.map((l) => l.user?.id || l.id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-gray-500">Track all user actions across the platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Events Today</p>
            <p className="text-2xl font-bold">{todayLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Users Today</p>
            <p className="text-2xl font-bold">{uniqueUsersToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by user, action, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Entities</option>
          {uniqueEntities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-12 w-12" />}
          title="No activity found"
          description={search ? "Try adjusting your filters" : "No activity recorded yet"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => {
                const icon = actionIcons[log.action] || <Activity className="h-4 w-4" />;
                const colorClass = actionColors[log.action] || "bg-gray-100 text-gray-700";

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar
                            name={log.user?.full_name || log.user?.email || "?"}
                            size="sm"
                          />
                          <span className="font-medium text-sm">
                            {log.user?.full_name || log.user?.email || "Unknown User"}
                          </span>
                          <span className="text-gray-500 text-sm">{log.action}</span>
                          {log.entity_type && (
                            <Badge variant="outline" className="text-xs">
                              {log.entity_type}
                            </Badge>
                          )}
                        </div>
                        {log.entity_name && (
                          <p className="text-sm text-gray-600 mt-1">{log.entity_name}</p>
                        )}
                        {log.ip_address && (
                          <p className="text-xs text-gray-400 mt-1">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">
                          {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
