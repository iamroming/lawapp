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
import { dbWrite } from "@/lib/db-write";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";

export default function NewTimesheetPage() {
  const { user: appUser } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [cases, setCases] = useState<any[]>([]);
  const [form, setForm] = useState({
    case_id: "",
    description: "",
    hours: "",
    is_billable: true,
    worked_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      if (!appUser) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid)
        .single();
      const query = supabase.from("cases").select("id, title, case_number");
      if (profile?.firm_id) query.eq("firm_id", profile.firm_id);
      const { data } = await query;
      if (data) setCases(data);
    };
    fetchCases();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hours) return;
    setSaving(true);

    if (!appUser) { setSaving(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const { error } = await dbWrite("timesheets", "insert", {
      case_id: form.case_id || null,
      description: form.description || null,
      hours: parseFloat(form.hours),
      is_billable: form.is_billable,
      worked_date: form.worked_date,
      user_id: appUser?.uuid,
      firm_id: profile?.firm_id || null,
    });

    setSaving(false);
    if (error) {
      toast.error(error || "Failed to save timesheet");
      return;
    }
    toast.success("Time entry saved");
    router.push("/timesheets");
  };

  const caseOptions = [{ value: "", label: "No case" }, ...cases.map((c) => ({ value: c.id, label: `${c.case_number} - ${c.title}` }))];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/timesheets"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Log Time Entry</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Time Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Case (optional)</label>
              <Select
                options={caseOptions}
                value={form.case_id}
                onChange={(e) => setForm({ ...form, case_id: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hours *</label>
                <Input type="number" step="0.25" min="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="e.g. 2.5" required />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={form.worked_date} onChange={(e) => setForm({ ...form, worked_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did you work on?" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={form.is_billable} onChange={(e) => setForm({ ...form, is_billable: e.target.checked })} className="rounded" />
              Billable to client
            </label>
          </CardContent>
        </Card>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Entry"}</Button>
        </div>
      </form>
    </div>
  );
}
