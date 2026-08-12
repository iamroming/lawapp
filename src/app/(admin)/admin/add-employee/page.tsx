"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Key, Copy, Check, AlertCircle, Loader2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

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
];

const ALLOTMENT_STATUS = [
  { value: "allotted", label: "Allotted" },
  { value: "pending", label: "Pending Discussion" },
  { value: "not_allotted", label: "Not Allotted" },
];

export default function AddEmployeePage() {
  const { user: appUser } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("associate");
  const [paymentType, setPaymentType] = useState("fixed_salary");
  const [allotmentStatus, setAllotmentStatus] = useState("allotted");
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [percentageRate, setPercentageRate] = useState<number>(0);
  const [upiId, setUpiId] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<Record<string, any>>({});
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userLimit, setUserLimit] = useState<{ used: number; max: number; plan: string; atLimit: boolean } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      if (!appUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, firm_id")
        .eq("id", appUser?.uuid)
        .single();

      setIsOwner(profile?.role === "owner" || profile?.role === "partner");

      // Fetch user limit info
      const firmId = profile?.firm_id || appUser?.uuid;
      const { count: memberCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("firm_id", firmId)
        .eq("is_active", true);

      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan:subscription_plans(name, max_users)")
        .eq("user_id", firmId)
        .in("status", ["active", "trialing"])
        .limit(1)
        .single();

      const plan = subData?.plan ? (Array.isArray(subData.plan) ? subData.plan[0] : subData.plan) : null;
      const maxUsers = plan?.max_users ?? 1;
      const used = memberCount || 0;
      setUserLimit({
        used,
        max: maxUsers,
        plan: plan?.name || "Free",
        atLimit: maxUsers !== -1 && used >= maxUsers,
      });

      // Fetch branches
      const branchRes = await fetch("/api/branches");
      const branchData = await branchRes.json();
      if (Array.isArray(branchData)) {
        setBranches(branchData);
      }

      // Fetch role salary defaults
      try {
        const res = await fetch("/api/salary/role-settings");
        const data = await res.json();
        if (!data.error) {
          const defaults: Record<string, any> = {};
          (data || []).forEach((s: any) => { defaults[s.role] = s; });
          setRoleDefaults(defaults);
        }
      } catch {}

      setLoadingDefaults(false);
      setLoading(false);
    };
    init();
  }, [appUser, supabase]);

  const isValidEmail = (val: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);

  // Auto-allot payment type when role changes
  useEffect(() => {
    const defaults = roleDefaults[role];
    if (defaults) {
      setPaymentType(defaults.payment_type || "fixed_salary");
      setMonthlySalary(defaults.monthly_salary || 0);
      setPercentageRate(defaults.percentage_rate || 0);
    }
  }, [role, roleDefaults]);

  const handleGenerate = async () => {
    setMessage(null);
    setGeneratedCode(null);

    if (!email.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }
    if (!isValidEmail(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setSaving(true);

    try {
      const defaults = roleDefaults[role] || {};
      const res = await fetch("/api/team/invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: role,
          email: email.trim(),
          payment_type: paymentType,
          allotment_status: allotmentStatus,
          upi_id: upiId.trim() || null,
          monthly_salary: paymentType === "fixed_salary" ? monthlySalary : 0,
          percentage_rate: paymentType === "profit_sharing" ? percentageRate : 0,
          pf_enabled: defaults.pf_enabled || false,
          esi_enabled: defaults.esi_enabled || false,
          tds_rate: defaults.tds_rate || 0,
          branch_id: selectedBranches.length > 0 ? selectedBranches[0] : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setMessage({ type: "error", text: data.error || "User limit reached" });
        } else {
          setMessage({ type: "error", text: data.error || "Failed to generate code" });
        }
      } else {
        setGeneratedCode(data.code);
        setMessage({ type: "success", text: `Invite code generated for ${email}!` });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-[var(--text-secondary)]">Only firm owners and partners can add employees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Add Employee</h1>
        <p className="text-[var(--text-secondary)]">Enter employee details to generate an invite code</p>
      </div>

      {/* User limit banner */}
      {userLimit && (
        <div className={`p-4 rounded-lg border ${
          userLimit.atLimit
            ? "bg-red-50 border-red-200"
            : userLimit.max !== -1 && userLimit.used >= userLimit.max * 0.8
            ? "bg-amber-50 border-amber-200"
            : "bg-[var(--surface-subtle)] border-[var(--border)]"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-sm font-medium">
                  Team: {userLimit.used} / {userLimit.max === -1 ? "Unlimited" : userLimit.max}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {userLimit.plan} plan
                </p>
              </div>
            </div>
            {userLimit.atLimit && (
              <a href="/subscription-required" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap">
                Upgrade Plan
              </a>
            )}
          </div>
          {userLimit.atLimit && (
            <p className="text-xs text-red-600 mt-2">
              You&apos;ve reached your plan limit. Upgrade to add more team members.
            </p>
          )}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Employee Email</label>
            <Input
              type="email"
              placeholder="employee@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              options={ROLES}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {roleDefaults[role] && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-medium text-green-800">Auto-allotted from role settings:</p>
              <p className="text-green-700 mt-1">
                {roleDefaults[role].payment_type === "fixed_salary"
                  ? `Fixed Salary: ${formatCurrency(roleDefaults[role].monthly_salary || 0)}/month`
                  : `Profit Share: ${roleDefaults[role].percentage_rate || 0}% of case fees`}
              </p>
              {(roleDefaults[role].pf_enabled || roleDefaults[role].esi_enabled || roleDefaults[role].tds_rate > 0) && (
                <p className="text-xs text-green-600 mt-1">
                  Deductions: {roleDefaults[role].pf_enabled ? "PF " : ""}{roleDefaults[role].esi_enabled ? "ESI " : ""}{roleDefaults[role].tds_rate > 0 ? `TDS ${roleDefaults[role].tds_rate}%` : ""}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Payment Type</label>
            <Select
              options={PAYMENT_TYPES}
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            />
          </div>

          <div>
            {paymentType === "fixed_salary" ? (
              <>
                <label className="block text-sm font-medium mb-1">Monthly Salary (Rs.)</label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={monthlySalary || ""}
                  onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Fixed monthly salary for this employee</p>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">Profit Share Percentage (%)</label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={percentageRate || ""}
                  onChange={(e) => setPercentageRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Percentage of case fees earned on assigned cases</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Allotment Status</label>
            <Select
              options={ALLOTMENT_STATUS}
              value={allotmentStatus}
              onChange={(e) => setAllotmentStatus(e.target.value)}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {allotmentStatus === "allotted" && "Employee has agreed to the salary/profit share terms"}
              {allotmentStatus === "pending" && "Discussion in progress — terms not yet finalized"}
              {allotmentStatus === "not_allotted" && "No salary/profit share allotment yet"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">UPI ID (for payments)</label>
            <Input
              type="text"
              placeholder="e.g., employee@upi or 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Optional — Used for salary payments via UPI</p>
          </div>

          {branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Branches</label>
              <div className="space-y-2 mt-1">
                {branches.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedBranches.includes(branch.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBranches((prev) => [...prev, branch.id]);
                        } else {
                          setSelectedBranches((prev) => prev.filter((id) => id !== branch.id));
                        }
                      }}
                      className="rounded"
                    />
                    {branch.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Optional — Employee will be assigned to selected branches</p>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={saving || userLimit?.atLimit} className="w-full">
            <Key className="h-4 w-4 mr-2" />
            {saving ? "Generating..." : userLimit?.atLimit ? "Plan Limit Reached" : "Generate Invite Code"}
          </Button>

          {generatedCode && (
            <div className="p-4 bg-[var(--background)] rounded-lg">
              <p className="text-sm font-medium mb-2">
                Invite code for <span className="font-bold">{email}</span> ({ROLES.find(r => r.value === role)?.label}):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold tracking-wider text-center p-3 bg-[var(--surface)] rounded border">
                  {generatedCode}
                </code>
                <Button size="sm" variant="outline" onClick={copyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Share this code with the employee. They can use it during signup to join your firm.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
