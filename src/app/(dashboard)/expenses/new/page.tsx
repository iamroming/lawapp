"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { value: "court_fees", label: "Court Fees" },
  { value: "travel", label: "Travel" },
  { value: "filing", label: "Filing" },
  { value: "notary", label: "Notary" },
  { value: "stamp_duty", label: "Stamp Duty" },
  { value: "postal", label: "Postal" },
  { value: "photocopy", label: "Photocopy" },
  { value: "other", label: "Other" },
];

export default function NewExpensePage() {
  const router = useRouter();
  const supabase = createClient();
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    category: "other",
    case_id: "",
    client_id: "",
    is_billable: true,
    expense_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      const [casesRes, clientsRes] = await Promise.all([
        supabase.from("cases").select("id, title, case_number"),
        supabase.from("clients").select("id, full_name"),
      ]);
      if (casesRes.data) setCases(casesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    };
    fetchOptions();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setSaving(true);

    const { error } = await supabase.from("expenses").insert({
      title: form.title,
      description: form.description || null,
      amount: parseFloat(form.amount),
      category: form.category,
      case_id: form.case_id || null,
      client_id: form.client_id || null,
      is_billable: form.is_billable,
      expense_date: form.expense_date,
    });

    setSaving(false);
    if (!error) router.push("/expenses");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/expenses"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">New Expense</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Expense Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Court filing fee" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount (Rs.) *</label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  options={CATEGORIES}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Case (optional)</label>
                <Select
                  options={[{ value: "", label: "None" }, ...cases.map((c) => ({ value: c.id, label: `${c.case_number} - ${c.title}` }))]}
                  value={form.case_id}
                  onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client (optional)</label>
                <Select
                  options={[{ value: "", label: "None" }, ...clients.map((c) => ({ value: c.id, label: c.full_name }))]}
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={form.is_billable} onChange={(e) => setForm({ ...form, is_billable: e.target.checked })} className="rounded" />
                  Billable to client
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
