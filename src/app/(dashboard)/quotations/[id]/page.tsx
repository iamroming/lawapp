"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, Trash2, Download } from "lucide-react";
import { ShareDialog } from "@/components/share-dialog";
import Link from "next/link";
import toast from "react-hot-toast";

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  description: string;
  client: { id: string; full_name: string; phone: string; email: string; address: string } | null;
  case: { id: string; case_number: string; title: string } | null;
  items: { description: string; quantity: number; unit_price: number }[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  valid_until: string;
  notes: string;
  terms: string;
  created_at: string;
  sent_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/quotations/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setQuotation(d.quotation); setLoading(false); });
  }, [params.id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const res = await fetch(`/api/quotations/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setUpdating(false);
    if (data.error) return toast.error(data.error);
    setQuotation((prev) => prev ? { ...prev, status } : null);
    toast.success(`Quotation ${status}`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this quotation?")) return;
    await fetch(`/api/quotations/${params.id}`, { method: "DELETE" });
    toast.success("Deleted");
    router.push("/quotations");
  };

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;
  if (!quotation) return <div className="text-center py-12 text-[var(--text-secondary)]">Quotation not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/quotations"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{quotation.title}</h1>
            <Badge className={statusColors[quotation.status]}>{quotation.status}</Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{quotation.quotation_number}</p>
        </div>
        <div className="flex gap-2">
          <ShareDialog type="quotation" id={quotation.id} />
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
        </div>
      </div>

      {quotation.status === "draft" && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("sent")} disabled={updating}><Send className="h-4 w-4 mr-2" /> Mark as Sent</Button>
        </div>
      )}
      {quotation.status === "sent" && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("accepted")} disabled={updating} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-2" /> Accept</Button>
          <Button variant="destructive" onClick={() => updateStatus("rejected")} disabled={updating}><XCircle className="h-4 w-4 mr-2" /> Reject</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {quotation.client?.full_name || "—"}</p>
            <p><span className="font-medium">Email:</span> {quotation.client?.email || "—"}</p>
            <p><span className="font-medium">Phone:</span> {quotation.client?.phone || "—"}</p>
            <p><span className="font-medium">Address:</span> {quotation.client?.address || "—"}</p>
            {quotation.case && (
              <p><span className="font-medium">Case:</span> {quotation.case.case_number} - {quotation.case.title}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quotation Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Created:</span> {formatDate(quotation.created_at)}</p>
            {quotation.sent_at && <p><span className="font-medium">Sent:</span> {formatDate(quotation.sent_at)}</p>}
            {quotation.valid_until && <p><span className="font-medium">Valid Until:</span> {formatDate(quotation.valid_until)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Description</th>
                <th className="text-right py-2 font-medium w-20">Qty</th>
                <th className="text-right py-2 font-medium w-28">Rate</th>
                <th className="text-right py-2 font-medium w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.unit_price.toLocaleString("en-IN")}</td>
                  <td className="py-2 text-right font-medium">₹{(item.quantity * item.unit_price).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quotation.subtotal)}</span></div>
            {quotation.tax_rate > 0 && <div className="flex justify-between"><span>Tax ({quotation.tax_rate}%)</span><span>{formatCurrency(quotation.tax_amount)}</span></div>}
            {quotation.discount_amount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(quotation.discount_amount)}</span></div>}
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{formatCurrency(quotation.total_amount)}</span></div>
          </div>
        </CardContent>
      </Card>

      {(quotation.notes || quotation.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotation.notes && <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{quotation.notes}</p></CardContent></Card>}
          {quotation.terms && <Card><CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{quotation.terms}</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}
