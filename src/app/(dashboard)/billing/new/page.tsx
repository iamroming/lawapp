"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
  client_id: string;
}

export default function NewInvoicePage() {
  const { user: appUser } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);

  const [form, setForm] = useState({
    client_id: "",
    case_id: "",
    amount: "",
    description: "",
    gst_rate: "18",
    due_date: "",
    billing_type: "fixed",
  });

  useEffect(() => {
    async function loadData() {
      if (!appUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid)
        .single();

      if (!profile?.firm_id) return;

      const [clientsRes, casesRes] = await Promise.all([
        supabase.from("clients").select("id, full_name, email, phone").is("deleted_at", null).eq("firm_id", profile.firm_id),
        supabase.from("cases").select("id, case_number, title, client_id").is("deleted_at", null).eq("firm_id", profile.firm_id),
      ]);

      setClients((clientsRes.data || []) as Client[]);
      setCases((casesRes.data || []) as Case[]);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (form.client_id) {
      setFilteredCases(cases.filter((c) => c.client_id === form.client_id));
    } else {
      setFilteredCases(cases);
    }
  }, [form.client_id, cases]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.client_id || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Client and valid amount are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: form.client_id,
          case_id: form.case_id || null,
          amount: parseFloat(form.amount),
          description: form.description,
          gst_rate: parseFloat(form.gst_rate),
          due_date: form.due_date || null,
          billing_type: form.billing_type,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invoice");
      }

      toast.success("Invoice created successfully!");
      router.push("/billing");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const amount = parseFloat(form.amount) || 0;
  const gstRate = parseFloat(form.gst_rate) || 0;
  const gstAmount = (amount * gstRate) / 100;
  const totalAmount = amount + gstAmount;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-[var(--text-secondary)]">Create a new invoice for your client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[var(--text-accent)]" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Client *</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value, case_id: "" })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>

            {/* Case */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Case (optional)</label>
              <select
                value={form.case_id}
                onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select case...</option>
                {filteredCases.map((c) => (
                  <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                ))}
              </select>
            </div>

            {/* Billing Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Billing Type</label>
              <select
                value={form.billing_type}
                onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="fixed">Fixed Fee</option>
                <option value="hourly">Hourly</option>
                <option value="appearance">Per Appearance</option>
                <option value="retainer">Retainer</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Amount (₹) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            {/* GST Rate */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">GST Rate (%)</label>
              <select
                value={form.gst_rate}
                onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
              <textarea
                placeholder="Invoice description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Due Date</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>

            {/* Summary */}
            {amount > 0 && (
              <div className="bg-[var(--background)] rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({gstRate}%)</span>
                  <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/billing">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Receipt className="h-4 w-4 mr-1" />}
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
