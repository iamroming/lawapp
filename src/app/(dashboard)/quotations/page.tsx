"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, FileText, Send, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { buildQuotationShareText } from "@/lib/whatsapp-share";
import Link from "next/link";
import toast from "react-hot-toast";

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  client: { id: string; full_name: string; phone: string } | null;
  total_amount: number;
  status: string;
  valid_until: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchQuotations();
  }, [filter]);

  const fetchQuotations = async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/quotations" : `/api/quotations?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setQuotations(data.quotations || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quotation?")) return;
    const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success("Deleted");
    }
  };

  const filtered = quotations.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === "draft").length,
    sent: quotations.filter((q) => q.status === "sent").length,
    accepted: quotations.filter((q) => q.status === "accepted").length,
    totalValue: quotations.reduce((s, q) => s + (q.total_amount || 0), 0),
    acceptedValue: quotations.filter((q) => q.status === "accepted").reduce((s, q) => s + (q.total_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create and manage client quotations</p>
        </div>
        <Link href="/quotations/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Quotation</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-[var(--text-secondary)]">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          <p className="text-xs text-[var(--text-secondary)]">Draft</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
          <p className="text-xs text-[var(--text-secondary)]">Sent</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          <p className="text-xs text-[var(--text-secondary)]">Accepted</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold">{formatCurrency(stats.acceptedValue)}</p>
          <p className="text-xs text-[var(--text-secondary)]">Won Value</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "draft", "sent", "accepted", "rejected"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No quotations found</p>
          <Link href="/quotations/new"><Button className="mt-4"><Plus className="h-4 w-4 mr-2" /> Create Quotation</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/quotations/${q.id}`} className="font-semibold hover:underline truncate">{q.title}</Link>
                      <Badge className={statusColors[q.status] || "bg-gray-100"}>{q.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {q.quotation_number} · {q.client?.full_name || "No client"} · {formatDate(q.created_at)}
                    </p>
                    {q.valid_until && (
                      <p className="text-xs text-[var(--text-tertiary)]">Valid until: {formatDate(q.valid_until)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-lg font-bold">{formatCurrency(q.total_amount)}</p>
                    <div className="flex gap-1">
                      {q.status === "draft" && (
                        <WhatsAppShareButton
                          text={buildQuotationShareText({
                            quotation_number: q.quotation_number,
                            client_name: q.client?.full_name || "Client",
                            total_amount: q.total_amount,
                            valid_until: q.valid_until,
                          })}
                          phoneNumber={q.client?.phone?.replace(/[^0-9]/g, "")}
                          label="Share"
                          className="text-xs"
                        />
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
