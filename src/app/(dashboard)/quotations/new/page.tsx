"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Client { id: string; full_name: string; phone: string; email: string; }
interface CaseItem { id: string; case_number: string; title: string; client_id: string; }
interface QuoteItem { description: string; quantity: number; unit_price: number; }

export default function NewQuotationPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    client_id: "",
    case_id: "",
    tax_rate: 0,
    discount_amount: 0,
    valid_until: "",
    notes: "",
    terms: "",
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : d.clients || []));
    fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : d.cases || []));
  }, []);

  const filteredCases = form.client_id ? cases.filter((c) => c.client_id === form.client_id) : cases;

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const tax = subtotal * (form.tax_rate / 100);
  const total = subtotal + tax - form.discount_amount;

  const handleSubmit = async (status: "draft" | "sent") => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (items.length === 0 || !items[0].description.trim()) return toast.error("Add at least one item");
    setSaving(true);

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items, status }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.error) return toast.error(data.error);
    toast.success(status === "draft" ? "Quotation saved" : "Quotation sent");
    router.push(`/quotations/${data.quotation.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/quotations"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">New Quotation</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create a professional quotation for your client</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input placeholder="e.g. Legal Services - Property Dispute" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Client</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, case_id: "" })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Related Case</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.case_id} onChange={(e) => setForm({ ...form, case_id: e.target.value })}>
                <option value="">{form.client_id ? "Select case" : "Select a client first"}</option>
                {filteredCases.map((c) => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Valid Until</label>
              <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea rows={2} placeholder="Brief description of services..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
              </div>
              <div className="w-20">
                <Input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
              </div>
              <div className="w-28">
                <Input type="number" min={0} placeholder="Rate" value={item.unit_price || ""} onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))} />
              </div>
              <div className="w-24 text-right pt-2 font-medium">₹{(item.quantity * item.unit_price).toLocaleString("en-IN")}</div>
              {items.length > 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea rows={3} placeholder="Additional notes for the client..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Terms & Conditions</label>
                <Textarea rows={3} placeholder="Payment terms, validity, etc..." value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex items-center gap-2 text-sm">
                <span>Tax (%)</span>
                <Input type="number" min={0} max={100} className="w-20 ml-auto" value={form.tax_rate || ""} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
                <span className="w-20 text-right">{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Discount</span>
                <Input type="number" min={0} className="w-24 ml-auto" value={form.discount_amount || ""} onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })} />
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div>
                <label className="text-sm font-medium">Valid Until</label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" disabled={saving} onClick={() => handleSubmit("draft")}>Save as Draft</Button>
        <Button disabled={saving} onClick={() => handleSubmit("sent")}>Send to Client</Button>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
