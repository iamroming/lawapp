"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Send,
  FileText,
  MessageSquare,
  Phone,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CollectionLog {
  id: string;
  invoice_id: string;
  action: string;
  channel: string | null;
  notes: string | null;
  sent_at: string;
}

interface InvoiceWithCollections {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  due_date: string;
  status: string;
  client: { full_name: string } | null;
  collections: CollectionLog[];
}

const STAGES = [
  { key: "reminder", label: "Reminder", color: "bg-yellow-100 text-yellow-800" },
  { key: "final_notice", label: "Final Notice", color: "bg-orange-100 text-orange-800" },
  { key: "legal_notice", label: "Legal Notice", color: "bg-red-100 text-red-800" },
  { key: "recovery", label: "Recovery", color: "bg-purple-100 text-purple-800" },
];

export default function CollectionsPage() {
  const [invoices, setInvoices] = useState<InvoiceWithCollections[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setInvoices(result.data || []);
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotice = async (invoiceId: string, action: string) => {
    setSendingId(invoiceId);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, action, channel: "email" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Notice sent");
      fetchCollections();
    } catch {
      toast.error("Failed to send notice");
    } finally {
      setSendingId(null);
    }
  };

  const getStageForInvoice = (inv: InvoiceWithCollections) => {
    if (!inv.collections || inv.collections.length === 0) return "reminder";
    const actions = inv.collections.map((c) => c.action);
    if (actions.includes("recovery")) return "recovery";
    if (actions.includes("legal_notice")) return "legal_notice";
    if (actions.includes("final_notice")) return "final_notice";
    return "reminder";
  };

  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case "email":
        return <Send className="h-3 w-3" />;
      case "whatsapp":
        return <MessageSquare className="h-3 w-3" />;
      case "phone":
        return <Phone className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  const totalOutstanding = invoices.reduce(
    (sum, i) => sum + i.amount + (i.tax_amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Collections Workflow</h1>
          <p className="text-[var(--text-secondary)]">
            Total outstanding: {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageInvoices = invoices.filter(
            (inv) => getStageForInvoice(inv) === stage.key
          );
          return (
            <Card key={stage.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge className={stage.color}>{stage.label}</Badge>
                  <span className="text-[var(--text-secondary)]">{stageInvoices.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    stageInvoices.reduce(
                      (s, i) => s + i.amount + (i.tax_amount || 0),
                      0
                    )
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No outstanding invoices.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const stage = getStageForInvoice(inv);
                const isExpanded = expandedId === inv.id;
                return (
                  <div key={inv.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {inv.invoice_number}
                          </span>
                          <Badge
                            className={
                              STAGES.find((s) => s.key === stage)?.color || ""
                            }
                          >
                            {STAGES.find((s) => s.key === stage)?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {inv.client?.full_name || "N/A"} &middot; Due:{" "}
                          {formatDate(inv.due_date)} &middot;{" "}
                          {formatCurrency(inv.amount + (inv.tax_amount || 0))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : inv.id)
                          }
                        >
                          History
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendNotice(inv.id, "reminder")}
                          disabled={sendingId === inv.id}
                        >
                          {sendingId === inv.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          Send Notice
                        </Button>
                      </div>
                    </div>
                    {isExpanded && inv.collections && inv.collections.length > 0 && (
                      <div className="border-t bg-[var(--background)] p-4 space-y-2">
                        {inv.collections.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center gap-3 text-xs text-[var(--text-secondary)]"
                          >
                            {getChannelIcon(log.channel)}
                            <span className="font-medium capitalize">
                              {log.action.replace("_", " ")}
                            </span>
                            <span className="text-[var(--text-tertiary)]">
                              {new Date(log.sent_at).toLocaleString("en-IN")}
                            </span>
                            {log.notes && (
                              <span className="text-[var(--text-tertiary)]">- {log.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
