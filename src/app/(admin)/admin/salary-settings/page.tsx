"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface RoleSetting {
  role: string;
  payment_type: string;
  monthly_salary: number;
  percentage_rate: number;
  pf_enabled: boolean;
  esi_enabled: boolean;
  tds_rate: number;
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

const PAYMENT_TYPES = [
  { value: "fixed_salary", label: "Fixed Salary" },
  { value: "profit_sharing", label: "Profit Sharing" },
  { value: "case_percentage", label: "Case Percentage" },
];

export default function RoleSalarySettingsPage() {
  const [settings, setSettings] = useState<RoleSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/salary/role-settings");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Merge with all roles (add missing ones with defaults)
      const existing = data || [];
      const merged = ROLES.map((r) => {
        const found = existing.find((s: RoleSetting) => s.role === r.value);
        return found || {
          role: r.value,
          payment_type: "fixed_salary",
          monthly_salary: 0,
          percentage_rate: 0,
          pf_enabled: false,
          esi_enabled: false,
          tds_rate: 0,
        };
      });
      setSettings(merged);
    } catch (error: any) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const updateSetting = (role: string, field: keyof RoleSetting, value: any) => {
    setSettings((prev) =>
      prev.map((s) => (s.role === role ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/salary/role-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Role salary settings saved!");
    } catch (error: any) {
      toast.error(error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Role Salary Settings
          </h1>
          <p className="text-gray-500">Set default salary & payment type for each role. When adding an employee, their salary is auto-allotted based on role.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All
        </Button>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => {
          const roleLabel = ROLES.find((r) => r.value === setting.role)?.label || setting.role;
          return (
            <Card key={setting.role}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-48">
                    <Badge variant="secondary" className="text-sm">{roleLabel}</Badge>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Payment Type</label>
                      <select
                        value={setting.payment_type}
                        onChange={(e) => updateSetting(setting.role, "payment_type", e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      >
                        {PAYMENT_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>{pt.label}</option>
                        ))}
                      </select>
                    </div>

                    {setting.payment_type === "fixed_salary" ? (
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Monthly Salary (Rs.)</label>
                        <Input
                          type="number"
                          value={setting.monthly_salary || ""}
                          onChange={(e) => updateSetting(setting.role, "monthly_salary", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Percentage Rate (%)</label>
                        <Input
                          type="number"
                          value={setting.percentage_rate || ""}
                          onChange={(e) => updateSetting(setting.role, "percentage_rate", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">TDS Rate (%)</label>
                      <Input
                        type="number"
                        value={setting.tds_rate || ""}
                        onChange={(e) => updateSetting(setting.role, "tds_rate", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={setting.pf_enabled}
                          onChange={(e) => updateSetting(setting.role, "pf_enabled", e.target.checked)}
                          className="rounded"
                        />
                        PF (12%)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={setting.esi_enabled}
                          onChange={(e) => updateSetting(setting.role, "esi_enabled", e.target.checked)}
                          className="rounded"
                        />
                        ESI (0.75%)
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
