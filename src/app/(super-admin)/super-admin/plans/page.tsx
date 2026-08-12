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
} from "lucide-react";
import toast from "react-hot-toast";
import type { SubscriptionPlan } from "@/types/database";

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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(DEFAULT_PLAN);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const data = await getSuperAdminPlans();
      setPlans((data as SubscriptionPlan[]) || []);
    } catch {
      toast.error("Failed to load plans");
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
      const features = form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

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
      fetchPlans();
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
      fetchPlans();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete plan");
    }
  };

  const handleToggle = async (plan: SubscriptionPlan) => {
    try {
      await toggleSuperAdminPlanActive(plan.id, plan.is_active);
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      fetchPlans();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle plan");
    }
  };

  const activePlans = plans.filter((p) => p.is_active).length;
  const monthlyPlans = plans.filter((p) => p.billing_period === "monthly");
  const yearlyPlans = plans.filter((p) => p.billing_period === "yearly");

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Subscription Plans
          </h1>
          <p className="text-[var(--text-secondary)]">
            Create and manage pricing plans for your platform
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Plans" value={plans.length} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Active Plans" value={activePlans} icon={<Zap className="h-5 w-5" />} />
        <StatsCard title="Monthly Plans" value={monthlyPlans.length} icon={<IndianRupee className="h-5 w-5" />} />
        <StatsCard title="Yearly Plans" value={yearlyPlans.length} icon={<Users className="h-5 w-5" />} />
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No plans yet"
          description="Create your first subscription plan to get started"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
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
                <div>
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-[var(--text-secondary)] text-sm">/{plan.billing_period}</span>
                </div>

                {plan.description && (
                  <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
                )}

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

                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Features:</p>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-0.5">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-[var(--text-tertiary)]">+{plan.features.length - 4} more</li>
                      )}
                    </ul>
                  </div>
                )}

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
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Plan"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plan Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Starter, Professional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this plan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0 for free plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billing Period</label>
              <select
                value={form.billing_period}
                onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Cases</label>
              <Input
                type="number"
                value={form.max_cases}
                onChange={(e) => setForm({ ...form, max_cases: e.target.value })}
                placeholder="-1 = unlimited"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">-1 for unlimited</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Users</label>
              <Input
                type="number"
                value={form.max_users}
                onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                placeholder="-1 = unlimited"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">-1 for unlimited</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Storage (MB)</label>
              <Input
                type="number"
                value={form.max_storage_mb}
                onChange={(e) => setForm({ ...form, max_storage_mb: e.target.value })}
                placeholder="-1 = unlimited"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">-1 for unlimited</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"AI Case Analysis\nPriority Support\nUnlimited Documents"}
              rows={4}
              className="flex w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Active</p>
              <p className="text-xs text-[var(--text-secondary)]">Plan is available for purchase</p>
            </div>
            <button
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-green-600" : "bg-gray-200"}`}
            >
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
