"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Activity, Search } from "lucide-react";
import { formatDateTime, unwrap } from "@/lib/utils";
import type { AuditLog } from "@/types/database";

export default function SuperAdminActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    const { data } = await supabase.from("activity_logs").select("*, user:profiles(full_name, email)").order("created_at", { ascending: false }).limit(500);
    setLogs(
      (data || []).map((l) => ({
        ...l,
        user: unwrap(l.user),
      })) as AuditLog[]
    );
    setLoading(false);
  };

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  const filtered = logs.filter((l) => {
    const match = l.action?.toLowerCase().includes(search.toLowerCase()) || l.entity_name?.toLowerCase().includes(search.toLowerCase()) || l.user?.full_name?.toLowerCase().includes(search.toLowerCase());
    const action = actionFilter === "all" || l.action === actionFilter;
    return match && action;
  });

  const actionColors: Record<string, string> = {
    login: "bg-blue-100 text-blue-700", create: "bg-green-100 text-green-700", update: "bg-yellow-100 text-yellow-700", delete: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-orange-500" />All Activity Logs</h1>
      <p className="text-gray-500">Every action across the entire platform ({logs.length} events)</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-10 rounded-md border bg-white px-3 py-2 text-sm">
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filtered.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-gray-50">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>
                    {log.action?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar name={log.user?.full_name || log.user?.email || "?"} size="sm" />
                      <span className="font-medium text-sm">{log.user?.full_name || log.user?.email || "Unknown"}</span>
                      <span className="text-gray-500">{log.action}</span>
                      {log.entity_type && <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>}
                    </div>
                    {log.entity_name && <p className="text-sm text-gray-600 mt-1">{log.entity_name}</p>}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDateTime(log.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
