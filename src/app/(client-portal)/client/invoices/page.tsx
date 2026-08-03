"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Loader2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
  description: string | null;
  case?: { case_number: string; title: string } | null;
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadInvoices() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("invoices")
        .select("*, case:cases(case_number, title)")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setInvoices(
          data.map((inv) => ({
            ...inv,
            case: inv.case && typeof inv.case === "object" && "case_number" in inv.case
              ? inv.case as { case_number: string; title: string }
              : null,
          }))
        );
      }
      setLoading(false);
    }
    loadInvoices();
  }, [supabase]);

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded!");
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const totalPending = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount + (i.tax_amount || 0), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount + (i.tax_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-[var(--text-accent)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Invoices</h1>
          <p className="text-[var(--text-secondary)]">View and download your invoices</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2.5">
              <Receipt className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Pending</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(totalPending)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Paid</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--background)]">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice #</th>
                    <th className="px-4 py-2 text-left">Case</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t hover:bg-[var(--surface-subtle)]">
                      <td className="px-4 py-3 font-medium">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        {inv.case
                          ? `${inv.case.case_number} - ${inv.case.title}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(inv.amount + (inv.tax_amount || 0))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {inv.due_date ? formatDate(inv.due_date) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(inv.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
