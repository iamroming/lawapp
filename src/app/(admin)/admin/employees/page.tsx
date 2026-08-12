"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { useUser } from "@/hooks/use-user";
import {
  Trash2,
  Edit,
} from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  payment_type: string;
  monthly_salary: number;
  percentage_rate: number;
  pf_enabled: boolean;
  esi_enabled: boolean;
  tds_rate: number;
  upi_id: string;
  allotment_status: string;
}

const ROLES = [
  { value: "partner", label: "Partner" },
  { value: "senior_associate", label: "Senior Associate" },
  { value: "associate", label: "Associate" },
  { value: "junior_associate", label: "Junior Associate" },
  { value: "paralegal", label: "Paralegal" },
  { value: "intern", label: "Intern" },
  { value: "office_admin", label: "Office Admin" },
];

export default function EmployeesPage() {
  const { user: appUser } = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "associate",
    payment_type: "fixed_salary",
    monthly_salary: 0,
    percentage_rate: 0,
    pf_enabled: false,
    esi_enabled: false,
    tds_rate: 0,
    upi_id: "",
    allotment_status: "allotted",
  });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      if (!appUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid)
        .single();

      const fid = profile?.firm_id;
      setFirmId(fid);

      if (fid) {
        await fetchEmployees(fid);
      }
    };
    init();
  }, [appUser, supabase]);

  const fetchEmployees = async (fid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, payment_type, monthly_salary, percentage_rate, pf_enabled, esi_enabled, tds_rate, upi_id, allotment_status")
      .eq("firm_id", fid)
      .order("created_at", { ascending: false });

    setEmployees((data || []) as Employee[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!firmId || !editEmployee) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        role: form.role,
        payment_type: form.payment_type,
        monthly_salary: form.monthly_salary,
        percentage_rate: form.percentage_rate,
        pf_enabled: form.pf_enabled,
        esi_enabled: form.esi_enabled,
        tds_rate: form.tds_rate,
        upi_id: form.upi_id || null,
        allotment_status: form.allotment_status,
      })
      .eq("id", editEmployee.id)
      .eq("firm_id", firmId);

    if (!error) {
      await fetchEmployees(firmId);
      setDialogOpen(false);
      setEditEmployee(null);
    }
    setSaving(false);
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Remove ${emp.full_name || emp.email} from the firm?`)) return;
    if (!firmId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", emp.id)
      .eq("firm_id", firmId);

    if (!error) {
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
    }
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setForm({
      full_name: emp.full_name || "",
      email: emp.email || "",
      role: emp.role || "associate",
      payment_type: emp.payment_type || "fixed_salary",
      monthly_salary: emp.monthly_salary || 0,
      percentage_rate: emp.percentage_rate || 0,
      pf_enabled: emp.pf_enabled || false,
      esi_enabled: emp.esi_enabled || false,
      tds_rate: emp.tds_rate || 0,
      upi_id: emp.upi_id || "",
      allotment_status: emp.allotment_status || "allotted",
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-[var(--text-secondary)]">Manage your firm&apos;s team members</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[var(--background)]">
                  <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Allotment</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-[var(--surface-subtle)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">
                              {(emp.full_name || emp.email || "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-sm">{emp.full_name || "Unnamed"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{emp.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{emp.role || "none"}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          emp.allotment_status === "allotted" ? "default" :
                          emp.allotment_status === "pending" ? "secondary" : "outline"
                        }>
                          {emp.allotment_status === "allotted" ? "Allotted" :
                           emp.allotment_status === "pending" ? "Pending" : "Not Allotted"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{formatDate(emp.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(emp)}
                            disabled={emp.role === "owner"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(emp)}
                            disabled={emp.role === "owner"}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Edit Employee Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={form.full_name} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={form.email} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              options={ROLES}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Allotment Status</label>
            <Select
              options={[
                { value: "allotted", label: "Allotted" },
                { value: "pending", label: "Pending Discussion" },
                { value: "not_allotted", label: "Not Allotted" },
              ]}
              value={form.allotment_status}
              onChange={(e) => setForm({ ...form, allotment_status: e.target.value })}
            />
          </div>
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-3">Salary Details</p>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Type</label>
              <Select
                options={[
                  { value: "fixed_salary", label: "Fixed Salary" },
                  { value: "profit_sharing", label: "Profit Sharing" },
                  { value: "case_percentage", label: "Case Percentage" },
                ]}
                value={form.payment_type}
                onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
              />
            </div>
            {form.payment_type === "fixed_salary" ? (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Monthly Salary (Rs.)</label>
                <Input
                  type="number"
                  value={form.monthly_salary}
                  onChange={(e) => setForm({ ...form, monthly_salary: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Percentage Rate (%)</label>
                <Input
                  type="number"
                  value={form.percentage_rate}
                  onChange={(e) => setForm({ ...form, percentage_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pf_enabled}
                  onChange={(e) => setForm({ ...form, pf_enabled: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Enable PF (12%)</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.esi_enabled}
                  onChange={(e) => setForm({ ...form, esi_enabled: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Enable ESI (0.75%)</label>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">TDS Rate (%)</label>
              <Input
                type="number"
                value={form.tds_rate}
                onChange={(e) => setForm({ ...form, tds_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <Input
                type="text"
                placeholder="e.g., employee@upi or 9876543210@paytm"
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">For salary payments via UPI</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
