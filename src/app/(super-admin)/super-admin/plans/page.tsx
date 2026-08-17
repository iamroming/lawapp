"use client";
import React, { useEffect, useState } from "react";
import {
  getSuperAdminPlans,
  createSuperAdminPlan,
  updateSuperAdminPlan,
  deleteSuperAdminPlan,
  toggleSuperAdminPlanActive,
} from "@/app/actions/super-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  Users,
  IndianRupee,
  ToggleLeft,
  ToggleRight,
  Package,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import type { SubscriptionPlan } from "@/types/database";

interface PlanAnalytics extends SubscriptionPlan {
  activeSubs: number;
  trialingSubs: number;
  cancelledSubs: number;
  totalSubs: number;
  totalRevenue: number;
  mrr: number;
  conversionRate: string;
  churnRate: string;
  recentSubs: number;
}

interface PlanOverview {
  totalPlans: number;
  activePlans: number;
  totalActive: number;
  totalTrialing: number;
  totalCancelled: number;
  totalSubs: number;
  totalMRR: number;
  totalRevenue: number;
  overallConversion: string;
  overallChurn: string;
}

const DEFAULT_PLAN = {
  name: "",
  slug: "",
  description: "",
  price: "",
  billing_period: "monthly",
  features: "",
  max_cases: "-1",
  max_users: "1",
  max_storage_mb: "100",
  is_active: true,
};

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [analytics, setAnalytics] = useState<PlanAnalytics[]>([]);
  const [overview, setOverview] = useState<PlanOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(DEFAULT_PLAN);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [plansData, analyticsRes] = await Promise.all([
        getSuperAdminPlans(),
        fetch("/api/super-admin/plan-analytics").then((r) => r.json()),
      ]);
      setPlans((plansData as SubscriptionPlan[]) || []);
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.planStats);
        setOverview(analyticsRes.overview);
      }
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm(DEFAULT_PLAN);
    setShowModal(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price: plan.price.toString(),
      billing_period: plan.billing_period,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      max_cases: plan.max_cases.toString(),
      max_users: plan.max_users.toString(),
      max_storage_mb: plan.max_storage_mb.toString(),
      is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Plan name is required"); return; }
    if (!form.price || Number(form.price) < 0) { toast.error("Valid price is required"); return; }

    setSubmitting(true);
    try {
      const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        billing_period: form.billing_period,
        features,
        max_cases: form.max_cases === "-1" ? -1 : Number(form.max_cases),
        max_users: form.max_users === "-1" ? -1 : Number(form.max_users),
        max_storage_mb: form.max_storage_mb === "-1" ? -1 : Number(form.max_storage_mb),
        is_active: form.is_active,
      };

      if (editingPlan) {
        await updateSuperAdminPlan(editingPlan.id, payload);
        toast.success("Plan updated!");
      } else {
        await createSuperAdminPlan(payload);
        toast.success("Plan created!");
      }
      setShowModal(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to save plan");
    }
    setSubmitting(false);
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await deleteSuperAdminPlan(plan.id);
      toast.success("Plan deleted");
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete plan");
    }
  };

  const handleToggle = async (plan: SubscriptionPlan) => {
    try {
      await toggleSuperAdminPlanActive(plan.id, plan.is_active);
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle plan");
    }
  };

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Subscription Plans
          </h1>
          <p className="text-[var(--text-secondary)]">Manage plans and monitor performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAll} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatsCard title="Total Plans" value={overview.totalPlans} icon={<Package className="h-5 w-5" />} />
          <StatsCard title="Active Plans" value={overview.activePlans} icon={<Zap className="h-5 w-5" />} />
          <StatsCard title="Total Subscribers" value={overview.totalActive} icon={<Users className="h-5 w-5" />} />
          <StatsCard title="Trialing" value={overview.totalTrialing} icon={<Users className="h-5 w-5" />} />
          <StatsCard title="MRR" value={formatCurrency(overview.totalMRR)} icon={<IndianRupee className="h-5 w-5" />} />
          <StatsCard title="Total Revenue" value={formatCurrency(overview.totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
        </div>
      )}

      {/* Conversion & Churn */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{overview.overallConversion}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Overall Churn Rate</p>
                <p className="text-2xl font-bold text-red-600">{overview.overallChurn}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards with Analytics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Plan Performance
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analytics.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">{plan.slug}</p>
                  </div>
                  <Badge variant={plan.is_active ? "success" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div>
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-[var(--text-secondary)] text-sm">/{plan.billing_period}</span>
                </div>

                {plan.description && (
                  <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
                )}

                {/* Limits */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-[var(--surface-subtle)]">
                    <p className="font-bold">{plan.max_cases === -1 ? "Unlimited" : plan.max_cases}</p>
                    <p className="text-[var(--text-tertiary)]">Cases</p>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-subtle)]">
                    <p className="font-bold">{plan.max_users === -1 ? "Unlimited" : plan.max_users}</p>
                    <p className="text-[var(--text-tertiary)]">Users</p>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-subtle)]">
                    <p className="font-bold">{plan.max_storage_mb === -1 ? "Unlimited" : `${plan.max_storage_mb}MB`}</p>
                    <p className="text-[var(--text-tertiary)]">Storage</p>
                  </div>
                </div>

                {/* Analytics */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subscribers</span>
                    <span className="font-semibold">{plan.totalSubs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold text-green-600">{plan.activeSubs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trialing</span>
                    <span className="font-semibold text-purple-600">{plan.trialingSubs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-semibold text-red-600">{plan.cancelledSubs}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">MRR</span>
                    <span className="font-bold text-green-600">{formatCurrency(plan.mrr)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold">{formatCurrency(plan.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversion</span>
                    <span className="font-semibold">{plan.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Churn</span>
                    <span className="font-semibold text-red-500">{plan.churnRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last 30 days</span>
                    <span className="font-semibold">+{plan.recentSubs}</span>
                  </div>
                </div>

                {/* Features */}
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Features:</p>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-0.5">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-[var(--text-tertiary)]">+{plan.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(plan)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(plan)}>
                    {plan.is_active ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Plan"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plan Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Starter" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0 for free" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billing Period</label>
              <select value={form.billing_period} onChange={(e) => setForm({ ...form, billing_period: e.target.value })} className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Cases</label>
              <Input type="number" value={form.max_cases} onChange={(e) => setForm({ ...form, max_cases: e.target.value })} placeholder="-1 = unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Users</label>
              <Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} placeholder="-1 = unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Storage (MB)</label>
              <Input type="number" value={form.max_storage_mb} onChange={(e) => setForm({ ...form, max_storage_mb: e.target.value })} placeholder="-1 = unlimited" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Features (one per line)</label>
            <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Feature 1\nFeature 2\nFeature 3"} rows={4} className="flex w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Active</p>
              <p className="text-xs text-[var(--text-secondary)]">Plan available for purchase</p>
            </div>
            <button onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-green-600" : "bg-gray-200"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
