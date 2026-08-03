"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency, unwrap } from "@/lib/utils";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
  client?: { full_name: string } | null;
  case?: { case_number: string; title: string } | null;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadInvoices() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("invoices")
        .select("*, client:clients(full_name), case:cases(case_number, title)")
        .eq("issued_by", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setInvoices(data.map((inv) => ({
          ...inv,
          client: unwrap(inv.client),
          case: unwrap(inv.case),
        })));
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

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading billing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Billing & Invoices</h1>
          <p className="text-[var(--text-secondary)]">Manage your invoices and payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--text-secondary)]">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
          <Link href="/billing/new">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
          </Link>
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
                    <th className="px-4 py-2 text-left">Client</th>
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
                      <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.client?.full_name || "—"}</td>
                      <td className="px-4 py-3">{inv.case?.case_number || "—"}</td>
                      <td className="px-4 py-3">{formatCurrency(inv.amount + (inv.tax_amount || 0))}</td>
                      <td className="px-4 py-3">
                        <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "destructive" : "secondary"}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(inv.id)}>
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
