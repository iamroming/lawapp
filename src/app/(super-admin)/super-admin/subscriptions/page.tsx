"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, unwrap } from "@/lib/utils";
import { Receipt, IndianRupee, Users, Settings, Shield, Percent } from "lucide-react";
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
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [pRes, sRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("price"),
      supabase.from("user_subscriptions").select("*, user:profiles(full_name, email), plan:subscription_plans(name, price)").order("created_at", { ascending: false }),
    ]);
    setPlans(pRes.data || []);
    setSubscriptions(
      (sRes.data || []).map((s) => ({
        ...s,
        user: unwrap(s.user),
        plan: unwrap(s.plan),
      })) as SubscriptionWithPlan[]
    );
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("user_subscriptions").update({ status }).eq("id", id);
    toast.success("Status updated");
    fetchData();
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
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Plans" value={plans.length} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Active Subscriptions" value={activeSubs.length} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Plans</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div key={p.id} className={`p-4 rounded-lg border ${!p.is_active ? "opacity-50" : ""}`}>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-2xl font-bold mt-1">{formatCurrency(p.price)}<span className="text-sm font-normal text-gray-500">/{p.billing_period}</span></p>
                <p className="text-xs text-gray-500 mt-2">{p.description}</p>
                <Badge variant={p.is_active ? "success" : "secondary"} className="mt-2">{p.is_active ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Subscriptions ({subscriptions.length})</span>
            <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUserIds.length === activeSubs.length && activeSubs.length > 0}
                onChange={() => {
                  if (selectedUserIds.length === activeSubs.length) {
                    setSelectedUserIds([]);
                  } else {
                    setSelectedUserIds(activeSubs.map((s) => s.user_id));
                  }
                }}
                className="rounded"
              />
              Select all active
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? <p className="text-gray-500 text-center py-8">No subscriptions.</p> : (
            <div className="divide-y">
              {subscriptions.map((s) => (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(s.user_id)}
                      onChange={() => toggleUserSelect(s.user_id)}
                      className="rounded flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.user?.full_name || s.user?.email || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{s.plan?.name || "N/A"} | Started {formatDate(s.starts_at)}</p>
                      {(s.custom_price !== null && s.custom_price !== undefined) && (
                        <p className="text-xs text-blue-600">Custom: {formatCurrency(s.custom_price)}</p>
                      )}
                      {(s.discount_percent !== null && s.discount_percent !== undefined && s.discount_percent > 0) && (
                        <p className="text-xs text-purple-600">{s.discount_percent}% discount</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={s.status === "active" ? "success" : s.status === "cancelled" ? "destructive" : "secondary"}>{s.status}</Badge>
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
