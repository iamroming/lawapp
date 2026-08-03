"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CauseListEntry {
  id: string;
  case_id: string;
  court_name: string;
  bench: string | null;
  cause_list_type: string;
  serial_number: string | null;
  hearing_date: string;
  judge_name: string | null;
  fetched_at: string;
  case: {
    id: string;
    case_number: string;
    title: string;
    client: { full_name: string } | null;
  } | null;
}

export default function CauseListPage() {
  const [entries, setEntries] = useState<CauseListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const supabase = createClient();

  useEffect(() => {
    fetchEntries();
  }, [selectedDate]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cause-list?from=${selectedDate}&to=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setEntries(result.data || []);
    } catch {
      toast.error("Failed to load cause list");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cause-list/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const result = await res.json();
      toast.success(`Synced ${result.count || 0} entries`);
      fetchEntries();
    } catch {
      toast.error("Failed to sync cause list");
    } finally {
      setSyncing(false);
    }
  };

  const getStatus = (hearingDate: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (hearingDate < today) return { label: "Overdue", variant: "destructive" as const, icon: AlertTriangle };
    if (hearingDate === today) return { label: "Today", variant: "default" as const, icon: CheckCircle };
    return { label: "Upcoming", variant: "secondary" as const, icon: Clock };
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const todayCount = entries.filter((e) => e.hearing_date === todayStr).length;
  const overdueCount = entries.filter((e) => e.hearing_date < todayStr).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[var(--text-accent)]" />
            Cause List
          </h1>
          <p className="text-[var(--text-secondary)]">Your personalized court cause list</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Cause List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Today&apos;s Hearings</p>
            <p className="text-2xl font-bold">{todayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">This Week</p>
            <p className="text-2xl font-bold">
              {entries.filter(
                (e) => e.hearing_date >= todayStr && e.hearing_date <= weekEnd
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hearing List</CardTitle>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">
              No hearings for this date.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const status = getStatus(entry.hearing_date);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--surface-subtle)]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {entry.case?.case_number || "N/A"}
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {entry.case?.title || "N/A"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mt-1">
                        <span>{entry.court_name}</span>
                        {entry.judge_name && <span>Judge: {entry.judge_name}</span>}
                        {entry.case?.client && (
                          <span>Client: {entry.case.client.full_name}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/cases/${entry.case_id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
