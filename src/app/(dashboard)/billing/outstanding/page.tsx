"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  IndianRupee,
  ArrowLeft,
  Loader2,
  Send,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface UnpaidInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  days_overdue: number;
  client: { id: string; full_name: string } | null;
  case: { case_number: string; title: string } | null;
}

export default function OutstandingPage() {
  const [invoices, setInvoices] = useState<UnpaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState("");
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?status=sent");
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      const unpaid = (result.data || []).filter(
        (i: UnpaidInvoice) => i.status !== "paid"
      );
      setInvoices(unpaid.sort((a: UnpaidInvoice, b: UnpaidInvoice) => b.days_overdue - a.days_overdue));
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, full_name")
      .is("deleted_at", null);
    setClients((data || []) as { id: string; full_name: string }[]);
  };

  const handleSendReminder = async (invoiceId: string) => {
    setSendingReminder(invoiceId);
    try {
      const res = await fetch("/api/invoices/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reminder sent");
      fetchInvoices();
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const filtered = filterClient
    ? invoices.filter((i) => i.client?.id === filterClient)
    : invoices;

  const totalOutstanding = filtered.reduce(
    (sum, i) => sum + i.amount + (i.tax_amount || 0),
    0
  );

  const bucket030 = filtered.filter((i) => i.days_overdue <= 30);
  const bucket3160 = filtered.filter(
    (i) => i.days_overdue > 30 && i.days_overdue <= 60
  );
  const bucket6190 = filtered.filter(
    (i) => i.days_overdue > 60 && i.days_overdue <= 90
  );
  const bucket90 = filtered.filter((i) => i.days_overdue > 90);

  const AgingBar = ({
    label,
    count,
    amount,
  }: {
    label: string;
    count: number;
    amount: number;
  }) => (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs text-gray-400">{formatCurrency(amount)}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-orange-600" />
            Outstanding Payments
          </h1>
          <p className="text-gray-500">Track and manage unpaid invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <AgingBar
              label="0-30 days"
              count={bucket030.length}
              amount={bucket030.reduce(
                (s, i) => s + i.amount + (i.tax_amount || 0),
                0
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <AgingBar
              label="31-60 days"
              count={bucket3160.length}
              amount={bucket3160.reduce(
                (s, i) => s + i.amount + (i.tax_amount || 0),
                0
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <AgingBar
              label="61-90 days"
              count={bucket6190.length}
              amount={bucket6190.reduce(
                (s, i) => s + i.amount + (i.tax_amount || 0),
                0
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unpaid Invoices ({filtered.length})</CardTitle>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No outstanding invoices.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {inv.invoice_number}
                      </span>
                      {inv.days_overdue > 60 ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" /> {inv.days_overdue}d overdue
                        </Badge>
                      ) : inv.days_overdue > 0 ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" /> {inv.days_overdue}d overdue
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">
                      {inv.client?.full_name || "N/A"} &middot; Due:{" "}
                      {formatDate(inv.due_date)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inv.case?.case_number || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(inv.amount + (inv.tax_amount || 0))}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => handleSendReminder(inv.id)}
                      disabled={sendingReminder === inv.id}
                    >
                      {sendingReminder === inv.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Send className="h-3 w-3 mr-1" />
                      )}
                      Send Reminder
                    </Button>
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
