"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminCoupons, toggleSuperAdminCouponActive, deleteSuperAdminCoupon, getSuperAdminCouponUses } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Ticket, Plus, Search, Trash2, Eye, ToggleLeft, ToggleRight, Copy, Gift, Calendar, Users, Percent, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  current_uses: number;
  max_per_user: number;
  billing_cycle: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  description: string;
  plan: { id: string; name: string; slug: string } | null;
  created_at: string;
}

interface CouponUse {
  id: string;
  used_at: string;
  amount_before: number;
  amount_after: number;
  user: { full_name: string; email: string } | null;
  plan: { name: string } | null;
}

const DISCOUNT_TYPE_STYLES: Record<string, { selected: string; icon: string }> = {
  percent: { selected: "border-purple-500 bg-purple-50", icon: "text-purple-600" },
  fixed: { selected: "border-orange-500 bg-orange-50", icon: "text-orange-600" },
  free: { selected: "border-green-500 bg-green-50", icon: "text-green-600" },
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponUses, setCouponUses] = useState<CouponUse[]>([]);
  const [showUses, setShowUses] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string; slug: string }[]>([]);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percent",
    discount_value: 30,
    plan_id: "",
    max_uses: 100,
    max_per_user: 1,
    billing_cycle: "both",
    valid_from: "",
    valid_until: "",
    description: "",
  });

  useEffect(() => { fetchCoupons(); fetchPlans(); }, []);

  const fetchPlans = async () => {
    setPlans([]);
  };

  const fetchCoupons = async () => {
    const data = await getSuperAdminCoupons();
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCoupon.code) { toast.error("Code is required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCoupon,
          plan_id: newCoupon.plan_id || null,
          max_uses: newCoupon.max_uses || -1,
          max_per_user: newCoupon.max_per_user || -1,
          billing_cycle: newCoupon.billing_cycle || "both",
          valid_from: newCoupon.valid_from || null,
          valid_until: newCoupon.valid_until || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Coupon created!");
      setShowCreate(false);
      setNewCoupon({
        code: "", discount_type: "percent", discount_value: 30, plan_id: "",
        max_uses: 100, max_per_user: 1, billing_cycle: "both",
        valid_from: "", valid_until: "", description: "",
      });
      fetchCoupons();
    } catch (e: any) {
      toast.error(e.message || "Failed to create coupon");
    }
    setCreating(false);
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await toggleSuperAdminCouponActive(coupon.id, coupon.is_active);
      toast.success(coupon.is_active ? "Coupon deactivated" : "Coupon activated");
      fetchCoupons();
    } catch {
      toast.error("Failed to toggle coupon");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    try {
      await deleteSuperAdminCoupon(id);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const viewUses = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    const data = await getSuperAdminCouponUses(coupon.id);
    setCouponUses((data as CouponUse[]) || []);
    setShowUses(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const generateCode = (type: string) => {
    const prefixes: Record<string, string> = { percent: "SAVE", fixed: "FLAT", free: "FRIEND" };
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewCoupon((p) => ({ ...p, code: `${prefixes[type] || "COUPON"}${suffix}` }));
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCoupons = coupons.filter((c) => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.current_uses, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-purple-500" />
            Coupon Management
          </h1>
          <p className="text-[var(--text-secondary)]">{coupons.length} total coupons, {activeCoupons} active, {totalUses} total uses</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Generate Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{coupons.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Total Coupons</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCoupons}</p>
          <p className="text-sm text-[var(--text-secondary)]">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalUses}</p>
          <p className="text-sm text-[var(--text-secondary)]">Total Uses</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{coupons.filter((c) => c.discount_type === "free").length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Friend Bypass</p>
        </CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading coupons...</div>
      ) : filteredCoupons.length === 0 ? (
        <EmptyState icon={<Ticket className="h-12 w-12" />} title="No coupons found" description="Create your first coupon to get started" />
      ) : (
        <div className="grid gap-3">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${coupon.discount_type === "free" ? "bg-gradient-to-br from-green-500 to-emerald-600" : coupon.discount_type === "percent" ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-orange-500 to-red-600"}`}>
                      {coupon.discount_type === "free" ? "FREE" : coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-bold text-lg">{coupon.code}</h3>
                        <button onClick={() => copyCode(coupon.code)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><Copy className="h-3 w-3" /></button>
                        {!coupon.is_active && <Badge variant="outline" className="text-red-500 border-red-300">Inactive</Badge>}
                        {coupon.discount_type === "free" && <Badge className="bg-green-100 text-green-700"><Gift className="h-3 w-3 mr-1" />Friend Bypass</Badge>}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{coupon.description || "No description"}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1">
                        <span>{coupon.plan?.name || "All plans"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{coupon.billing_cycle || "both"}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{coupon.current_uses}{coupon.max_uses === -1 ? "" : `/${coupon.max_uses}`}</span>
                        <span>{coupon.max_per_user === 1 ? "1x per user" : "Unlimited/user"}</span>
                        {coupon.valid_until && <span>Expires {formatDate(coupon.valid_until)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => viewUses(coupon)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(coupon)}>
                      {coupon.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteCoupon(coupon.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Generate New Coupon">
        <div className="space-y-5">
          {/* Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Coupon Code</label>
            <div className="flex gap-2">
              <Input value={newCoupon.code} onChange={(e) => setNewCoupon((p) => ({ ...p, code: e.target.value.toUpperCase().trim().replace(/[^A-Z0-9]/g, "") }))} placeholder="e.g., SAVE30" className="font-mono" />
              <Button variant="outline" onClick={() => generateCode(newCoupon.discount_type)}>Generate</Button>
            </div>
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "percent", label: "Percentage Off", icon: Percent },
                { value: "fixed", label: "Fixed Amount", icon: DollarSign },
                { value: "free", label: "Free Access", icon: Gift },
              ].map((t) => {
                const isActive = newCoupon.discount_type === t.value;
                const styles = DISCOUNT_TYPE_STYLES[t.value] || { selected: "border-gray-500 bg-gray-50", icon: "text-gray-600" };
                return (
                  <button
                    key={t.value}
                    onClick={() => setNewCoupon((p) => ({ ...p, discount_type: t.value, code: "", discount_value: t.value === "free" ? 0 : t.value === "percent" ? 30 : 500 }))}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      isActive
                        ? styles.selected
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <t.icon className={`h-5 w-5 mx-auto mb-1 ${isActive ? styles.icon : "text-gray-400"}`} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount Value */}
          {newCoupon.discount_type !== "free" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {newCoupon.discount_type === "percent" ? "Percentage (%)" : "Amount (₹)"}
              </label>
              <Input
                type="number"
                value={newCoupon.discount_value}
                onChange={(e) => setNewCoupon((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                min={1}
                max={newCoupon.discount_type === "percent" ? 99 : undefined}
              />
            </div>
          )}

          {/* Plan + Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Applies to Plan</label>
              <select value={newCoupon.plan_id} onChange={(e) => setNewCoupon((p) => ({ ...p, plan_id: e.target.value }))} className="w-full h-10 rounded-md border border-[var(--border)] px-3 text-sm">
                <option value="">All Plans</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Cycle</label>
              <select value={newCoupon.billing_cycle} onChange={(e) => setNewCoupon((p) => ({ ...p, billing_cycle: e.target.value }))} className="w-full h-10 rounded-md border border-[var(--border)] px-3 text-sm">
                <option value="both">Both (Monthly + Annual)</option>
                <option value="monthly">Monthly Only</option>
                <option value="annual">Annual Only</option>
              </select>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Usage Limit</label>
              <Input
                type="number"
                value={newCoupon.max_uses}
                onChange={(e) => setNewCoupon((p) => ({ ...p, max_uses: Number(e.target.value) }))}
                placeholder="-1 = unlimited"
              />
              <p className="text-xs text-[var(--text-tertiary)]">-1 for unlimited, or set a number like 100</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Uses Per User</label>
              <select value={newCoupon.max_per_user} onChange={(e) => setNewCoupon((p) => ({ ...p, max_per_user: Number(e.target.value) }))} className="w-full h-10 rounded-md border border-[var(--border)] px-3 text-sm">
                <option value={1}>1 time (one-time use)</option>
                <option value={-1}>Unlimited (can reuse)</option>
              </select>
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid From</label>
              <Input type="date" value={newCoupon.valid_from} onChange={(e) => setNewCoupon((p) => ({ ...p, valid_from: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid Until</label>
              <Input type="date" value={newCoupon.valid_until} onChange={(e) => setNewCoupon((p) => ({ ...p, valid_until: e.target.value }))} />
              <p className="text-xs text-[var(--text-tertiary)]">Leave empty for no expiry</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={newCoupon.description} onChange={(e) => setNewCoupon((p) => ({ ...p, description: e.target.value }))} placeholder="e.g., 30% off for first 100 users" />
          </div>

          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Coupon"}
          </Button>
        </div>
      </Modal>

      {/* Coupon Usage Modal */}
      <Modal open={showUses} onClose={() => setShowUses(false)} title={`Usage: ${selectedCoupon?.code || ""}`}>
        {couponUses.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">No uses yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {couponUses.map((use) => (
              <div key={use.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{use.user?.full_name || "Unknown"}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{use.user?.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{use.plan?.name || "N/A"}</p>
                  <p className="text-[var(--text-secondary)]">{formatDate(use.used_at)}</p>
                  <p className="text-green-600">₹{use.amount_after.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
