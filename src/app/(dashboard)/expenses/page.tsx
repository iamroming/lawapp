"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Wallet, TrendingUp, Filter, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";

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

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default function ExpensesPage() {
  const { user: appUser } = useUser();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState("all");
  const [summary, setSummary] = useState({ total: 0, billable: 0, unbilled: 0, count: 0 });
  const supabase = createClient();

  useEffect(() => { fetchExpenses(); }, [categoryFilter, billableFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    if (!appUser) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
    const firmId = profile?.firm_id || appUser?.uuid;

    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (billableFilter !== "all") params.set("billable", billableFilter);

    let expensesQuery = supabase.from("expenses").select("*, cases(id, title, case_number), clients(id, full_name)").order("expense_date", { ascending: false });
    if (isOwner) {
      expensesQuery = expensesQuery.eq("firm_id", firmId);
    } else {
      expensesQuery = expensesQuery.eq("user_id", appUser?.uuid);
    }

    const [expensesRes, reportsRes] = await Promise.all([
      expensesQuery,
      fetch(`/api/expenses/reports?${params.toString()}`),
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data);
    const reports = await reportsRes.json();
    if (reports.summary) setSummary(reports.summary);
    setLoading(false);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await dbWrite("expenses", "delete", undefined, { id });
    if (error) {
      toast.error(error);
      return;
    }
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (billableFilter === "billable" && !e.is_billable) return false;
    if (billableFilter === "unbillable" && e.is_billable) return false;
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Expenses
        </h1>
        <Link href="/expenses/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary.total)}</p><p className="text-xs text-[var(--text-tertiary)]">{summary.count} entries</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Billable</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmt(summary.billable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Unbilled</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{fmt(summary.unbilled)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Non-Billable</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[var(--text-secondary)]">{fmt(summary.total - summary.billable)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex gap-4 pt-6">
          <Select
            options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: "all", label: "All" },
              { value: "billable", label: "Billable" },
              { value: "unbillable", label: "Non-Billable" },
            ]}
            value={billableFilter}
            onChange={(e) => setBillableFilter(e.target.value)}
            className="w-48"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <Wallet className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No expenses yet</p>
              <Link href="/expenses/new"><Button className="mt-2" size="sm"><Plus className="h-4 w-4 mr-2" /> Add First Expense</Button></Link>
            </div>
          ) : (
            <div className="divide-y">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-[var(--surface-subtle)]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{expense.title}</p>
                      <Badge variant="outline" className="text-xs">{CATEGORY_MAP[expense.category] || expense.category}</Badge>
                      {expense.is_billable && <Badge className="text-xs bg-green-100 text-green-700">Billable</Badge>}
                      {expense.is_billed && <Badge className="text-xs bg-[var(--surface-accent)] text-[var(--text-accent)]">Billed</Badge>}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {expense.cases?.case_number && <span className="mr-3">Case: {expense.cases.case_number}</span>}
                      {expense.clients?.full_name && <span className="mr-3">Client: {expense.clients.full_name}</span>}
                      <span>{expense.expense_date}</span>
                    </p>
                    {expense.description && <p className="text-xs text-[var(--text-tertiary)] mt-1">{expense.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{fmt(expense.amount)}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
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
