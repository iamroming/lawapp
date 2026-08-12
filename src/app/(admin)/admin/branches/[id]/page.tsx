"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import { ArrowLeft, Save, Trash2, Building2, Users, Briefcase, FileText, UserPlus, X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function BranchDetailPage() {
  const { user: appUser } = useUser();
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branch, setBranch] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [counts, setCounts] = useState({ cases: 0, clients: 0, invoices: 0 });
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string }>>({});
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchBranch = async () => {
      const res = await fetch(`/api/branches/${branchId}`);
      const data = await res.json();
      if (data.error) {
        toast.error("Branch not found");
        router.push("/admin/branches");
        return;
      }
      setBranch(data);
      setEmployees(data.employees || []);
      setCounts(data.counts || {});
      setForm({
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        phone: data.phone || "",
        email: data.email || "",
      });
      setOperatingHours(data.operating_hours || {});
      const days: Record<string, boolean> = {};
      DAYS.forEach((d) => { days[d] = !!data.operating_hours?.[d]; });
      setEnabledDays(days);
      setLoading(false);
    };
    fetchBranch();
  }, [branchId, router]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid || "")
        .single();

      const firmId = profile?.firm_id || appUser?.uuid;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("firm_id", firmId)
        .eq("is_active", true)
        .neq("role", "super_admin");

      setAllEmployees(data || []);
    };
    if (appUser) fetchEmployees();
  }, [appUser, supabase]);

  const handleDayToggle = (day: string) => {
    setEnabledDays((prev) => ({ ...prev, [day]: !prev[day] }));
    if (!enabledDays[day]) {
      setOperatingHours((prev) => ({
        ...prev,
        [day]: { open: "09:00", close: "18:00" },
      }));
    } else {
      setOperatingHours((prev) => {
        const next = { ...prev };
        delete next[day];
        return next;
      });
    }
  };

  const handleTimeChange = (day: string, field: "open" | "close", value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, operating_hours: operatingHours }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update branch");
      } else {
        toast.success("Branch updated");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this branch? Employees will be unassigned and cases/clients will lose their branch association.")) return;
    const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Branch deleted");
      router.push("/admin/branches");
    } else {
      toast.error("Failed to delete branch");
    }
  };

  const handleAddEmployee = async (employeeId: string) => {
    const res = await fetch(`/api/branches/${branchId}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId }),
    });
    if (res.ok) {
      toast.success("Employee added to branch");
      const added = allEmployees.find((e) => e.id === employeeId);
      if (added) setEmployees((prev) => [...prev, { ...added, is_primary: false }]);
      setShowAddEmployee(false);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add employee");
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    const res = await fetch(`/api/branches/${branchId}/employees`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId }),
    });
    if (res.ok) {
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      toast.success("Employee removed");
    }
  };

  const availableEmployees = allEmployees.filter(
    (e) => !employees.some((emp) => emp.id === e.id)
  );

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading branch...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/branches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{branch?.name}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Cases" value={counts.cases.toString()} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Clients" value={counts.clients.toString()} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Invoices" value={counts.invoices.toString()} icon={<FileText className="h-5 w-5" />} />
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Branch Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Branch name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day, i) => (
            <div key={day} className="flex items-center gap-4">
              <label className="flex items-center gap-2 w-32">
                <input
                  type="checkbox"
                  checked={enabledDays[day]}
                  onChange={() => handleDayToggle(day)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{DAY_LABELS[i]}</span>
              </label>
              {enabledDays[day] && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={operatingHours[day]?.open || "09:00"}
                    onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-[var(--text-secondary)]">to</span>
                  <Input
                    type="time"
                    value={operatingHours[day]?.close || "18:00"}
                    onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employees ({employees.length})</CardTitle>
          {availableEmployees.length > 0 && (
            <Button size="sm" onClick={() => setShowAddEmployee(!showAddEmployee)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showAddEmployee && (
            <div className="mb-4 p-3 bg-[var(--surface-subtle)] rounded-lg border border-[var(--border)]">
              <p className="text-sm font-medium mb-2">Select employee to add:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="text-sm font-medium">{emp.full_name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{emp.role}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleAddEmployee(emp.id)}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {employees.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">No employees assigned yet</p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg">
                  <div>
                    <p className="font-medium">{emp.full_name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{emp.role} • {emp.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveEmployee(emp.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
