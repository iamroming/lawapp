"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminSubscriptions, updateSuperAdminSubscriptionStatus } from "@/app/actions/super-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import { Receipt, IndianRupee, Users, Settings, Percent, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import type { SubscriptionPlan, SubscriptionWithPlan } from "@/types/database";

export default function SuperAdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithPlan | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [overrideForm, setOverrideForm] = useState({
    plan_id: "",
    status: "active",
    custom_price: "",
    discount_percent: "",
    expires_at: "",
    reason: "",
  });
  const [discountForm, setDiscountForm] = useState({
    discount_percent: "",
    expires_at: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const result = await getSuperAdminSubscriptions();
      const subs = (result.subscriptions as SubscriptionWithPlan[]) || [];
      const allPlans = (result.plans as SubscriptionPlan[]) || [];
      setSubscriptions(subs);
      setPlans(allPlans);
    } catch (e) {
      console.error("Failed to fetch subscriptions:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateSuperAdminSubscriptionStatus(id, status);
      toast.success("Status updated");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleOverride = async () => {
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/subscription-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedSub.user_id,
          plan_id: overrideForm.plan_id || undefined,
          status: overrideForm.status || undefined,
          custom_price: overrideForm.custom_price ? Number(overrideForm.custom_price) : undefined,
          discount_percent: overrideForm.discount_percent ? Number(overrideForm.discount_percent) : undefined,
          expires_at: overrideForm.expires_at || undefined,
          reason: overrideForm.reason || "Admin override",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Override failed");
      }
      toast.success("Subscription overridden");
      setShowOverrideModal(false);
      setSelectedSub(null);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Override failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDiscount = async () => {
    if (selectedUserIds.length === 0 || !discountForm.discount_percent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/subscription-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: selectedUserIds,
          discount_percent: Number(discountForm.discount_percent),
          expires_at: discountForm.expires_at || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Discount failed");
      }
      toast.success(`Discount applied to ${selectedUserIds.length} user(s)`);
      setShowDiscountModal(false);
      setSelectedUserIds([]);
      setDiscountForm({ discount_percent: "", expires_at: "" });
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Discount failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openOverride = (sub: SubscriptionWithPlan) => {
    setSelectedSub(sub);
    setOverrideForm({
      plan_id: sub.plan_id || "",
      status: sub.status,
      custom_price: sub.custom_price?.toString() || "",
      discount_percent: sub.discount_percent?.toString() || "",
      expires_at: sub.expires_at ? sub.expires_at.split("T")[0] : "",
      reason: "",
    });
    setShowOverrideModal(true);
  };

  const toggleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const trialingSubs = subscriptions.filter((s) => s.status === "trialing");
  const cancelledSubs = subscriptions.filter((s) => s.status === "cancelled");
  const expiredSubs = subscriptions.filter((s) => s.status === "expired");
  const pastDueSubs = subscriptions.filter((s) => s.status === "past_due");
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  // Filter subscriptions
  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch = searchTerm === "" ||
      s.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-green-500" />Subscriptions</h1>
        {selectedUserIds.length > 0 && (
          <Button onClick={() => setShowDiscountModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Percent className="h-4 w-4 mr-1" />Bulk Discount ({selectedUserIds.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatsCard title="Total" value={subscriptions.length} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Active" value={activeSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Trialing" value={trialingSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Past Due" value={pastDueSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Cancelled" value={cancelledSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
      </div>

      {/* Plans */}
      <Card>
        <CardHeader><CardTitle>Plans ({plans.length})</CardTitle></CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-4">No plans found in subscriptions.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((p) => {
                const planSubs = subscriptions.filter((s) => s.plan_id === p.id);
                const planActive = planSubs.filter((s) => s.status === "active").length;
                const planRevenue = planSubs.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
                return (
                  <div key={p.id} className={`p-4 rounded-lg border ${!p.is_active ? "opacity-50" : ""}`}>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(p.price)}<span className="text-sm font-normal text-[var(--text-secondary)]">/{p.billing_period}</span></p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">{p.description}</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs"><Badge variant={p.is_active ? "success" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></p>
                      <p className="text-xs text-gray-600">{planSubs.length} subscribers ({planActive} active)</p>
                      <p className="text-xs text-green-600">Revenue: {formatCurrency(planRevenue)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Subscriptions ({filteredSubs.length}{filterStatus !== "all" ? ` of ${subscriptions.length}` : ""})</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUserIds.length === activeSubs.length && activeSubs.length > 0}
                  onChange={() => {
                    if (selectedUserIds.length === activeSubs.length) setSelectedUserIds([]);
                    else setSelectedUserIds(activeSubs.map((s) => s.user_id));
                  }}
                  className="rounded"
                />
                <span className="text-sm font-normal">Select all active</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Search + Filter */}
        <div className="px-4 pb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <CardContent className="p-0">
          {filteredSubs.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No subscriptions found.</p>
          ) : (
            <div className="divide-y">
              {filteredSubs.map((s) => (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(s.user_id)}
                      onChange={() => toggleUserSelect(s.user_id)}
                      className="rounded flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.user?.full_name || "Unknown"}</p>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{s.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{s.plan?.name || "No Plan"}</Badge>
                        <span className="text-xs text-gray-500">Started {formatDate(s.starts_at)}</span>
                        {s.expires_at && <span className="text-xs text-gray-500">| Expires {formatDate(s.expires_at)}</span>}
                      </div>
                      {(s.custom_price !== null && s.custom_price !== undefined) && (
                        <p className="text-xs text-[var(--text-accent)]">Custom price: {formatCurrency(s.custom_price)}</p>
                      )}
                      {(s.discount_percent !== null && s.discount_percent !== undefined && s.discount_percent > 0) && (
                        <p className="text-xs text-purple-600">{s.discount_percent}% discount</p>
                      )}
                      {s.notes && (
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{s.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={s.status === "active" ? "success" : s.status === "cancelled" ? "destructive" : s.status === "trialing" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                    <span className="text-sm font-medium">{formatCurrency(s.amount_paid || 0)}</span>
                    <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} className="h-8 rounded border text-xs px-2">
                      {["active", "trialing", "past_due", "cancelled", "expired"].map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => openOverride(s)} title="Override">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Modal */}
      <Modal open={showOverrideModal} onClose={() => setShowOverrideModal(false)} title="Override Subscription" description={`For: ${selectedSub?.user?.full_name || selectedSub?.user?.email || "Unknown"}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plan</label>
            <select value={overrideForm.plan_id} onChange={(e) => setOverrideForm({ ...overrideForm, plan_id: e.target.value })} className="w-full rounded border px-3 py-2 text-sm">
              <option value="">No change</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)}/{p.billing_period})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={overrideForm.status} onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })} className="w-full rounded border px-3 py-2 text-sm">
              {["active", "trialing", "past_due", "cancelled", "expired"].map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Custom Price (₹)</label>
              <input type="number" value={overrideForm.custom_price} onChange={(e) => setOverrideForm({ ...overrideForm, custom_price: e.target.value })} placeholder="Leave empty for no change" className="w-full rounded border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input type="number" min="0" max="100" value={overrideForm.discount_percent} onChange={(e) => setOverrideForm({ ...overrideForm, discount_percent: e.target.value })} placeholder="0-100" className="w-full rounded border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expires At</label>
            <input type="date" value={overrideForm.expires_at} onChange={(e) => setOverrideForm({ ...overrideForm, expires_at: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input type="text" value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} placeholder="Why this override?" className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Saving..." : "Apply Override"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Discount Modal */}
      <Modal open={showDiscountModal} onClose={() => setShowDiscountModal(false)} title="Apply Bulk Discount" description={`Apply discount to ${selectedUserIds.length} selected user(s)`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Percent</label>
            <input type="number" min="1" max="100" value={discountForm.discount_percent} onChange={(e) => setDiscountForm({ ...discountForm, discount_percent: e.target.value })} placeholder="e.g. 20" className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
            <input type="date" value={discountForm.expires_at} onChange={(e) => setDiscountForm({ ...discountForm, expires_at: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
            <Button onClick={handleBulkDiscount} disabled={submitting || !discountForm.discount_percent} className="bg-purple-600 hover:bg-purple-700">
              {submitting ? "Applying..." : "Apply Discount"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
