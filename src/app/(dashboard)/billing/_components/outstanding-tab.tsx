"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface OutstandingCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  total_fee: number;
  amount_received: number;
  created_at: string;
  client: { full_name: string } | null;
}

export default function OutstandingTab() {
  const { user: appUser } = useUser();
  const [cases, setCases] = useState<OutstandingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState("");
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      if (!appUser) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, firm_id")
        .eq("id", appUser?.uuid)
        .single();

      const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
      const firmId = profile?.firm_id || appUser?.uuid;

      let query = supabase
        .from("cases")
        .select("id, case_number, title, status, total_fee, amount_received, created_at, client:clients(id, full_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (isOwner) {
        query = query.eq("firm_id", firmId);
      } else {
        query = query.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
      }

      const { data } = await query;
      const allCases = (data || []).map((c: any) => ({
        ...c,
        client: Array.isArray(c.client) ? c.client[0] : c.client,
      }));

      setCases(allCases);
      setClients(
        allCases
          .filter((c) => c.client && (c.total_fee || 0) - (c.amount_received || 0) > 0)
          .map((c) => c.client)
          .filter(Boolean)
          .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  const outstanding = cases.filter((c) => (c.total_fee || 0) > 0 && (c.total_fee || 0) - (c.amount_received || 0) > 0);
  const filtered = filterClient
    ? outstanding.filter((c) => c.client?.id === filterClient)
    : outstanding;

  const totalOutstanding = filtered.reduce((sum, c) => sum + ((c.total_fee || 0) - (c.amount_received || 0)), 0);

  const now = Date.now();
  const bucket030 = filtered.filter((c) => (now - new Date(c.created_at).getTime()) / 86400000 <= 30);
  const bucket3190 = filtered.filter((c) => {
    const days = (now - new Date(c.created_at).getTime()) / 86400000;
    return days > 30 && days <= 90;
  });
  const bucket90 = filtered.filter((c) => (now - new Date(c.created_at).getTime()) / 86400000 > 90);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Total Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{filtered.length} cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-[var(--text-secondary)]">Recent (0-30d)</p>
            <p className="text-lg font-bold">{bucket030.length}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(bucket030.reduce((s, c) => s + (c.total_fee - c.amount_received), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-[var(--text-secondary)]">Mid (31-90d)</p>
            <p className="text-lg font-bold">{bucket3190.length}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(bucket3190.reduce((s, c) => s + (c.total_fee - c.amount_received), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-[var(--text-secondary)]">Aging (90d+)</p>
            <p className="text-lg font-bold">{bucket90.length}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(bucket90.reduce((s, c) => s + (c.total_fee - c.amount_received), 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pending Payments ({filtered.length})</h3>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-1 border border-[var(--border)] rounded-md text-sm"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">All clear! No pending payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => {
                const pending = (c.total_fee || 0) - (c.amount_received || 0);
                const collected = c.total_fee > 0 ? Math.round((c.amount_received / c.total_fee) * 100) : 0;
                const daysSince = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-subtle)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/cases/${c.id}`} className="font-medium text-sm hover:underline truncate">{c.title}</Link>
                        <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        {daysSince > 90 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{c.case_number} &middot; {c.client?.full_name || "Unknown"}</p>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-48">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${collected}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-red-600">{formatCurrency(pending)}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">of {formatCurrency(c.total_fee)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Clock className="h-3 w-3" />
                        {daysSince}d
                      </div>
                    </div>
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
