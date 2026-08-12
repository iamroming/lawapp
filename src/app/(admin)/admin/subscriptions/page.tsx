"use client";
import React, { useEffect, useState } from "react";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import { Receipt, Plus, Users, IndianRupee, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  max_cases: number;
  max_users: number;
  max_storage_mb: number;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  amount_paid: number;
  auto_renew: boolean;
  created_at: string;
  user: { id: string; full_name: string; email: string } | null;
  plan: { name: string; price: number } | null;
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions">("plans");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const supabase = createServiceRoleClient();

  const [newPlan, setNewPlan] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    billing_period: "monthly",
    max_cases: "-1",
    max_users: "1",
    max_storage_mb: "100",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [plansRes, subsRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("price"),
      supabase
        .from("user_subscriptions")
        .select("*, user:profiles(id, full_name, email), plan:subscription_plans(name, price)")
        .order("created_at", { ascending: false }),
    ]);

    const formattedSubs = (subsRes.data || []).map((s: Record<string, unknown>) => ({
      ...s,
      user: unwrap(s.user),
      plan: unwrap(s.plan),
    }));

    setPlans((plansRes.data as Plan[]) || []);
    setSubscriptions(formattedSubs as UserSubscription[]);
    setLoading(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("subscription_plans").insert({
      name: newPlan.name,
      slug: newPlan.slug || newPlan.name.toLowerCase().replace(/\s+/g, "-"),
      description: newPlan.description,
      price: parseFloat(newPlan.price) || 0,
      billing_period: newPlan.billing_period,
      max_cases: parseInt(newPlan.max_cases),
      max_users: parseInt(newPlan.max_users),
      max_storage_mb: parseInt(newPlan.max_storage_mb),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Plan created!");
    setShowPlanModal(false);
    setNewPlan({
      name: "", slug: "", description: "", price: "", billing_period: "monthly",
      max_cases: "-1", max_users: "1", max_storage_mb: "100",
    });
    fetchData();
  };

  const togglePlanActive = async (plan: Plan) => {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    fetchData();
  };

  const updateSubStatus = async (subId: string, newStatus: string) => {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ status: newStatus })
      .eq("id", subId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subscription updated");
    fetchData();
  };

  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-[var(--text-secondary)]">Manage plans and user subscriptions</p>
        </div>
        <Button onClick={() => setShowPlanModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Plans" value={plans.length} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Active Subscriptions" value={activeSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "plans"
              ? "border-[var(--text-accent)] text-[var(--text-accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "subscriptions"
              ? "border-[var(--text-accent)] text-[var(--text-accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          User Subscriptions ({subscriptions.length})
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "success" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-[var(--text-secondary)]">/{plan.billing_period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Cases:</span>{" "}
                    {plan.max_cases === -1 ? "Unlimited" : plan.max_cases}
                  </p>
                  <p>
                    <span className="font-medium">Users:</span>{" "}
                    {plan.max_users === -1 ? "Unlimited" : plan.max_users}
                  </p>
                  <p>
                    <span className="font-medium">Storage:</span>{" "}
                    {plan.max_storage_mb === -1 ? "Unlimited" : `${plan.max_storage_mb} MB`}
                  </p>
                </div>
                {(() => {
                  let parsedFeatures: (string | Record<string, unknown>)[] = [];
                  try {
                    if (Array.isArray(plan.features)) {
                      parsedFeatures = plan.features;
                    } else if (typeof plan.features === "string") {
                      parsedFeatures = JSON.parse(plan.features);
                    }
                  } catch {
                    parsedFeatures = [];
                  }
                  return parsedFeatures.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Features:</p>
                      <ul className="space-y-1">
                        {parsedFeatures.map((f: string | Record<string, unknown>, i: number) => (
                        <li key={i} className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {typeof f === "string" ? f : JSON.stringify(f)}
                        </li>
                      ))}
                      </ul>
                    </div>
                  );
                })()}
                <Button
                  variant={plan.is_active ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => togglePlanActive(plan)}
                >
                  {plan.is_active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <Card>
          <CardContent className="p-0">
            {subscriptions.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-8">No subscriptions yet.</p>
            ) : (
              <div className="divide-y">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {sub.user?.full_name || sub.user?.email || "Unknown User"}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {sub.plan?.name || "No plan"} - Started {formatDate(sub.starts_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge
                        variant={
                          sub.status === "active"
                            ? "success"
                            : sub.status === "cancelled" || sub.status === "expired"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {sub.status}
                      </Badge>
                      <select
                        value={sub.status}
                        onChange={(e) => updateSubStatus(sub.id, e.target.value)}
                        className="h-8 rounded border border-[var(--border)] text-xs px-2"
                      >
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="past_due">Past Due</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Plan Modal */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Create New Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Name *</label>
            <Input
              value={newPlan.name}
              onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Premium"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input
              value={newPlan.slug}
              onChange={(e) => setNewPlan((p) => ({ ...p, slug: e.target.value }))}
              placeholder="auto-generated from name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={newPlan.description}
              onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (INR) *</label>
              <Input
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan((p) => ({ ...p, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Period</label>
              <select
                value={newPlan.billing_period}
                onChange={(e) => setNewPlan((p) => ({ ...p, billing_period: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Cases (-1=unlimited)</label>
              <Input
                type="number"
                value={newPlan.max_cases}
                onChange={(e) => setNewPlan((p) => ({ ...p, max_cases: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Users</label>
              <Input
                type="number"
                value={newPlan.max_users}
                onChange={(e) => setNewPlan((p) => ({ ...p, max_users: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Storage (MB)</label>
              <Input
                type="number"
                value={newPlan.max_storage_mb}
                onChange={(e) => setNewPlan((p) => ({ ...p, max_storage_mb: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
