"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  IndianRupee,
  Users,
  Calculator,
  CheckCircle,
  Clock,
  Settings,
  Plus,
  Loader2,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  payment_type: string;
  monthly_salary: number;
  percentage_rate: number;
}

interface SalaryPayment {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  payment_type: string;
  base_salary: number;
  percentage_earned: number;
  total_earnings: number;
  total_deductions: number;
  net_payable: number;
  status: string;
  paid_at: string;
  employee: { full_name: string; email: string };
}

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

const PAYMENT_TYPES: Record<string, string> = {
  fixed_salary: "Fixed Salary",
  case_percentage: "Case Percentage",
  hybrid: "Hybrid",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function SalaryDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.firm_id) return;

    // Fetch employees with salary info
    const { data: emps } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, payment_type, monthly_salary, percentage_rate")
      .eq("firm_id", profile.firm_id)
      .not("role", "eq", "owner");

    setEmployees((emps || []) as Employee[]);

    // Fetch salary payments for selected month
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).toISOString().split("T")[0];

    const { data: pays } = await supabase
      .from("salary_payments")
      .select(`
        *,
        employee:profiles!salary_payments_employee_id_fkey(full_name, email)
      `)
      .eq("firm_id", profile.firm_id)
      .gte("period_start", startDate)
      .lte("period_end", endDate)
      .order("created_at", { ascending: false });

    setPayments((pays || []) as SalaryPayment[]);
    setLoading(false);
  };

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      toast.error("Select an employee");
      return;
    }
    setCalculating(true);
    try {
      const res = await fetch("/api/salary/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmployee,
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Show calculation result
      toast.success(`Net payable: ${formatCurrency(data.net_payable)}`);
      setShowGenerateModal(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
    setCalculating(false);
  };

  const handleGeneratePayslips = async () => {
    setCalculating(true);
    try {
      for (const emp of employees) {
        const res = await fetch("/api/salary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: emp.id,
            period_start: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
            period_end: new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).toISOString().split("T")[0],
          }),
        });
        const data = await res.json();
        if (data.error) console.error(`Failed for ${emp.full_name}:`, data.error);
      }
      toast.success("Payslips generated!");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
    setCalculating(false);
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      const res = await fetch("/api/salary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, status: "paid" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Marked as paid!");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.net_payable || 0), 0);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.net_payable || 0), 0);

  const unpaidEmployees = employees.filter(
    (emp) => !payments.some((p) => p.employee_id === emp.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IndianRupee className="h-6 w-6" />
            Salary Management
          </h1>
          <p className="text-[var(--text-secondary)]">Manage employee salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Payslips
          </Button>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="flex gap-2">
        <Select
          options={MONTHS}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-40"
        />
        <Input
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-24"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--surface-accent)] rounded-lg">
                <Users className="h-5 w-5 text-[var(--text-accent)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Employees</p>
                <p className="text-xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Paid</p>
                <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Unpaid</p>
                <p className="text-xl font-bold">{unpaidEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Payments - {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <p>No salary payments generated for this month.</p>
              <Button className="mt-4" onClick={() => setShowGenerateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Payslips
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[var(--background)]">
                    <th className="text-left py-3 px-4 font-medium text-sm">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Base</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Percentage</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Deductions</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Net Payable</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b hover:bg-[var(--surface-subtle)]">
                      <td className="py-3 px-4">
                        <span className="font-medium">{pay.employee?.full_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{PAYMENT_TYPES[pay.payment_type] || pay.payment_type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">{formatCurrency(pay.base_salary)}</td>
                      <td className="py-3 px-4 text-right text-sm">{formatCurrency(pay.percentage_earned)}</td>
                      <td className="py-3 px-4 text-right text-sm font-medium">{formatCurrency(pay.total_earnings)}</td>
                      <td className="py-3 px-4 text-right text-sm text-red-600">{formatCurrency(pay.total_deductions)}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold">{formatCurrency(pay.net_payable)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pay.status] || ""}`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {pay.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPaid(pay.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Salary Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[var(--background)]">
                  <th className="text-left py-3 px-4 font-medium text-sm">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Payment Type</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Salary / Rate</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-[var(--surface-subtle)]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
<div className="h-8 w-8 rounded-full bg-[var(--surface-accent)] flex items-center justify-center">
                           <span className="text-sm font-medium text-[var(--text-accent)]">
                            {(emp.full_name || emp.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.full_name || "Unnamed"}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{emp.role}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{PAYMENT_TYPES[emp.payment_type] || "Fixed Salary"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      {emp.payment_type === "case_percentage"
                        ? `${emp.percentage_rate || 0}%`
                        : formatCurrency(emp.monthly_salary || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Payslips Modal */}
      <Modal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Payslips"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <Select options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={selectedEmployee ? handleCalculate : handleGeneratePayslips} disabled={calculating}>
              {calculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              {selectedEmployee ? "Calculate" : "Generate All"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SalarySettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

function SalarySettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState({
    default_pf_rate: 12,
    default_esi_rate: 0.75,
    default_tds_rate: 10,
    payment_cycle: "monthly",
    payment_day: 1,
    auto_calculate: true,
  });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) fetchSettings();
  }, [open]);

  const fetchSettings = async () => {
    const res = await fetch("/api/salary/settings");
    const data = await res.json();
    if (!data.error) {
      setSettings({
        default_pf_rate: data.default_pf_rate ?? 12,
        default_esi_rate: data.default_esi_rate ?? 0.75,
        default_tds_rate: data.default_tds_rate ?? 10,
        payment_cycle: data.payment_cycle ?? "monthly",
        payment_day: data.payment_day ?? 1,
        auto_calculate: data.auto_calculate ?? true,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/salary/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Settings saved!");
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Salary Settings">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">PF Rate (%)</label>
            <Input
              type="number"
              value={settings.default_pf_rate}
              onChange={(e) => setSettings({ ...settings, default_pf_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ESI Rate (%)</label>
            <Input
              type="number"
              value={settings.default_esi_rate}
              onChange={(e) => setSettings({ ...settings, default_esi_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">TDS Rate (%)</label>
            <Input
              type="number"
              value={settings.default_tds_rate}
              onChange={(e) => setSettings({ ...settings, default_tds_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Day</label>
            <Input
              type="number"
              value={settings.payment_day}
              onChange={(e) => setSettings({ ...settings, payment_day: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_calculate}
            onChange={(e) => setSettings({ ...settings, auto_calculate: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm">Auto-calculate salary on payment day</label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
