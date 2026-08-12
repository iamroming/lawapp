"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminRevenue, getSuperAdminInvoices } from "@/app/actions/super-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import { IndianRupee, TrendingUp, CreditCard, Clock } from "lucide-react";
import type { PaymentWithDetails, InvoiceWithDetails } from "@/types/database";

export default function SuperAdminRevenuePage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [payData, invData] = await Promise.all([
        getSuperAdminRevenue(),
        getSuperAdminInvoices(),
      ]);
      setPayments((payData || []) as PaymentWithDetails[]);
      setInvoices(
        (invData || []).map((i: any) => ({
          ...i,
          client: unwrap(i.client),
        })) as InvoiceWithDetails[]
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const thisMonth = payments.filter((p) => {
    const d = new Date(p.payment_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><IndianRupee className="h-6 w-6 text-green-500" />Revenue Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
        <StatsCard title="This Month" value={formatCurrency(monthRevenue)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Pending Amount" value={formatCurrency(pendingAmount)} icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Total Payments" value={payments.length} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent className="p-0">
              {payments.length === 0 ? <p className="text-[var(--text-secondary)] text-center py-8">No payments.</p> : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.client?.full_name || "Unknown"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{p.payment_method} | {formatDate(p.payment_date)}</p>
                    </div>
                    <p className="font-medium text-green-600">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Invoices</CardTitle></CardHeader>
          <CardContent className="p-0">
              {pendingInvoices.length === 0 ? <p className="text-[var(--text-secondary)] text-center py-8">No pending invoices.</p> : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {pendingInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{inv.client?.full_name || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(inv.amount)}</p>
                      <p className={`text-xs ${inv.status === "overdue" ? "text-red-500" : "text-yellow-500"}`}>{inv.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
