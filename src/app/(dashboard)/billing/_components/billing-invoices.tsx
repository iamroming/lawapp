"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { IndianRupee, TrendingUp, TrendingDown, Percent, Loader2 } from "lucide-react";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { buildInvoiceShareText } from "@/lib/whatsapp-share";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface CaseBilling {
  id: string;
  case_number: string;
  title: string;
  status: string;
  total_fee: number;
  amount_received: number;
  client: { full_name: string } | null;
}

export default function BillingInvoicesTab() {
  const { user: appUser } = useUser();
  const [cases, setCases] = useState<CaseBilling[]>([]);
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
        .select("id, case_number, title, status, total_fee, amount_received, client:clients(full_name)")
        .is("deleted_at", null)
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

  const totalBilled = cases.reduce((sum, c) => sum + (c.total_fee || 0), 0);
  const totalReceived = cases.reduce((sum, c) => sum + (c.amount_received || 0), 0);
  const totalPending = totalBilled - totalReceived;
  const collectionRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;

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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <IndianRupee className="h-4 w-4" />
              <p className="text-sm">Total Billed</p>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm">Received</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-sm">Pending</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Percent className="h-4 w-4 text-blue-500" />
              <p className="text-sm">Collection Rate</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{collectionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {cases.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No cases with fees yet. Set fees when editing a case.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Case</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Client</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Status</th>
                    <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">Total Fee</th>
                    <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">Received</th>
                    <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">Pending</th>
                    <th className="px-4 py-2 text-center font-medium text-[var(--text-secondary)]">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => {
                    const pending = (c.total_fee || 0) - (c.amount_received || 0);
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-[var(--surface-subtle)]">
                        <td className="px-4 py-3">
                          <Link href={`/cases/${c.id}`} className="font-medium hover:underline">
                            {c.title}
                          </Link>
                          <p className="text-xs text-[var(--text-tertiary)]">{c.case_number}</p>
                        </td>
                        <td className="px-4 py-3">{c.client?.full_name || "\u2014"}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.total_fee || 0)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(c.amount_received || 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={pending > 0 ? "text-red-600 font-medium" : "text-[var(--text-tertiary)]"}>
                            {formatCurrency(pending)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <WhatsAppShareButton
                            text={buildInvoiceShareText({
                              case_number: c.case_number,
                              client_name: c.client?.full_name || "Client",
                              amount: c.total_fee || 0,
                            })}
                            phoneNumber={c.client?.phone?.replace(/[^0-9]/g, "")}
                            label="Share"
                            className="text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
