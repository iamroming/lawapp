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

export default function NewTaskPage() {
  const { user: appUser } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    case_id: "",
    client_id: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid || "")
        .single();

      const casesQ = profile?.firm_id
        ? supabase.from("cases").select("id, title, case_number").eq("firm_id", profile.firm_id)
        : supabase.from("cases").select("id, title, case_number");
      const clientsQ = profile?.firm_id
        ? supabase.from("clients").select("id, full_name").eq("firm_id", profile.firm_id)
        : supabase.from("clients").select("id, full_name");
      const empQ = profile?.firm_id
        ? supabase.from("profiles").select("id, full_name, role").eq("firm_id", profile.firm_id).neq("role", "super_admin")
        : supabase.from("profiles").select("id, full_name, role").neq("role", "super_admin");

      const [casesRes, clientsRes, empRes] = await Promise.all([casesQ, clientsQ, empQ]);
      if (casesRes.data) setCases(casesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (empRes.data) setEmployees(empRes.data);
    };
    fetchOptions();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);

    if (!appUser) { setSaving(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const { error } = await dbWrite("tasks", "insert", {
      title: form.title,
      description: form.description || null,
      case_id: form.case_id || null,
      client_id: form.client_id || null,
      assigned_to: form.assigned_to || null,
      priority: form.priority,
      due_date: form.due_date || null,
      user_id: appUser?.uuid,
      firm_id: profile?.firm_id || null,
    });

    setSaving(false);
    if (error) {
      toast.error(error || "Failed to create task");
      return;
    }
    toast.success("Task created");
    router.push("/tasks");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tasks"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">New Task</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. File counter affidavit" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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
            <div>
              <label className="text-sm font-medium">Assign To (optional)</label>
              <Select
                options={[{ value: "", label: "Unassigned" }, ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.role})` }))]}
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Task details..." />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Create Task"}</Button>
        </div>
      </form>
    </div>
  );
}
