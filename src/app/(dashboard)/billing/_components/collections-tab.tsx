"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { CheckCircle, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface CaseCollection {
  id: string;
  case_number: string;
  title: string;
  status: string;
  case_type: string;
  total_fee: number;
  amount_received: number;
  client: { full_name: string } | null;
}

export default function CollectionsTab() {
  const { user: appUser } = useUser();
  const [cases, setCases] = useState<CaseCollection[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select("id, case_number, title, status, case_type, total_fee, amount_received, client:clients(full_name)")
        .is("deleted_at", null)
        .gt("total_fee", 0)
        .order("total_fee", { ascending: false });

      if (isOwner) {
        query = query.eq("firm_id", firmId);
      } else {
        query = query.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
      }

      const { data } = await query;
      setCases(
        (data || []).map((c: any) => ({
          ...c,
          client: Array.isArray(c.client) ? c.client[0] : c.client,
        }))
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  const billedCases = cases.filter((c) => c.total_fee > 0);
  const fullyPaid = billedCases.filter((c) => (c.amount_received || 0) >= c.total_fee);
  const partial = billedCases.filter((c) => (c.amount_received || 0) > 0 && (c.amount_received || 0) < c.total_fee);
  const noPayment = billedCases.filter((c) => !c.amount_received || c.amount_received === 0);

  const totalBilled = billedCases.reduce((s, c) => s + c.total_fee, 0);
  const totalCollected = billedCases.reduce((s, c) => s + (c.amount_received || 0), 0);

  const typeGroups = billedCases.reduce((acc, c) => {
    const type = c.case_type || "Other";
    if (!acc[type]) acc[type] = { total: 0, received: 0, count: 0 };
    acc[type].total += c.total_fee;
    acc[type].received += c.amount_received || 0;
    acc[type].count++;
    return acc;
  }, {} as Record<string, { total: number; received: number; count: number }>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium">Fully Paid</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{fullyPaid.length}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatCurrency(fullyPaid.reduce((s, c) => s + c.amount_received, 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-medium">Partial Payments</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{partial.length}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatCurrency(partial.reduce((s, c) => s + (c.amount_received || 0), 0))} collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">No Payment Yet</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{noPayment.length}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatCurrency(noPayment.reduce((s, c) => s + c.total_fee, 0))} billed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Collection by Case Type</h3>
          {Object.keys(typeGroups).length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">No billed cases yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeGroups)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([type, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.received / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{type}</span>
                          <Badge variant="outline" className="text-xs">{stats.count} cases</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${rate >= 80 ? "bg-green-500" : rate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{rate}%</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(stats.received)} / {formatCurrency(stats.total)}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Fully Collected Cases</h3>
          {fullyPaid.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">No fully paid cases yet.</p>
          ) : (
            <div className="space-y-2">
              {fullyPaid.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <Link href={`/cases/${c.id}`} className="font-medium text-sm hover:underline">{c.title}</Link>
                      <p className="text-xs text-[var(--text-tertiary)]">{c.client?.full_name || "\u2014"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(c.total_fee)}</p>
                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
