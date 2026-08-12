"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Check, CreditCard, Calendar, Download, ArrowUpRight, Crown, Shield, Zap, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";

interface Subscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  payment_method: string;
  amount_paid: number;
  auto_renew: boolean;
  notes: string;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  razorpay_payment_id: string;
  created_at: string;
}

const fallbackPlans = [
  { slug: "solo", name: "Solo", price: 299, monthly: 299, annual: 2999, icon: Shield, color: "blue" },
  { slug: "professional", name: "Professional", price: 799, monthly: 799, annual: 7999, icon: Crown, color: "purple" },
  { slug: "firm", name: "Firm", price: 1999, monthly: 1999, annual: 19999, icon: Crown, color: "indigo" },
  { slug: "enterprise", name: "Enterprise", price: 4999, monthly: 4999, annual: 49999, icon: Zap, color: "amber" },
];

const PLAN_ICONS: Record<string, React.ComponentType<any>> = { Shield, Crown, Zap };
const PLAN_COLORS: Record<string, string> = { blue: "blue", purple: "purple", indigo: "indigo", amber: "amber" };

export default function SubscriptionPage() {
  const { user: appUser } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(fallbackPlans);
  const [currentPlan, setCurrentPlan] = useState<string>("solo");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!appUser) { setLoading(false); return; }

    // Fetch plans from database, fallback to hardcoded
    try {
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("id, name, slug, price")
        .eq("is_active", true)
        .order("price");
      if (plansData && plansData.length > 0) {
        setPlans(plansData.map((p: any) => ({
          slug: p.slug,
          name: p.name,
          price: p.price,
          monthly: p.price,
          annual: p.price * 12,
          icon: PLAN_ICONS[p.slug] || Shield,
          color: PLAN_COLORS[p.slug] || "blue",
        })));
      }
    } catch (e) {
      console.error("Failed to fetch plans, using fallback:", e);
    }

    // Get profile to determine firm owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", appUser?.uuid)
      .single();

    // Determine the subscription owner: firm owner's ID (firm_id) or user's own ID
    let subscriptionUserId = appUser?.uuid;
    if (profile?.firm_id) {
      // For firm members, query by the firm owner's user_id (firm_id)
      subscriptionUserId = profile.firm_id;
    } else if (profile?.role === "owner") {
      subscriptionUserId = appUser?.uuid;
    }

    // Get current subscription
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", subscriptionUserId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subData) {
      setSubscription(subData);
      let notes: Record<string, any> = {};
      try {
        notes = JSON.parse(subData.notes || "{}");
      } catch {
        notes = {};
      }
      setCurrentPlan(notes.plan_slug || "free");
      setBillingCycle(notes.billing_cycle || "monthly");
    }

    // Get payment history from Razorpay
    try {
      const res = await fetch("/api/payments/history");
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
    }

    setLoading(false);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponData(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, billingCycle }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponData(data);
        toast.success(`Coupon applied: ${data.discount_type === "free" ? "Free access" : data.discount_type === "percent" ? `${data.discount_value}% off` : `₹${data.discount_value} off`}`);
      } else {
        setCouponError(data.error || "Invalid coupon");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
  };

  const handleUpgrade = async (planSlug: string) => {
    setUpgrading(planSlug);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, billingCycle, couponCode: couponData?.code || null }),
      });
      const orderData = await orderRes.json();

      if (orderData.error) {
        toast.error(orderData.error);
        setUpgrading(null);
        return;
      }

      // Free coupon — subscription activated directly
      if (orderData.free) {
        toast.success(`Subscription activated! ${orderData.discount || ""}`);
        removeCoupon();
        fetchData();
        setUpgrading(null);
        return;
      }

      const loadRazorpay = () => new Promise<void>((resolve) => {
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

      await loadRazorpay();
      const RazorpayConstructor = window.Razorpay as any;
      const rzp = new RazorpayConstructor({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CaseFiles",
        description: `${orderData.planName} Plan (${billingCycle})${orderData.discount ? ` - ${orderData.discount}` : ""}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planSlug,
              billingCycle,
              couponCode: couponData?.code || null,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Payment successful! Subscription activated.");
            fetchData();
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
          setUpgrading(null);
        },
        theme: { color: "#4f46e5" },
      });
      rzp.open();
    } catch {
      toast.error("Failed to start payment");
      setUpgrading(null);
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "trialing": return "bg-blue-100 text-blue-700";
      case "expired": return "bg-red-100 text-red-700";
      case "cancelled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "captured": return "bg-green-100 text-green-700";
      case "authorized": return "bg-blue-100 text-blue-700";
      case "failed": return "bg-red-100 text-red-700";
      case "refunded": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage your subscription and view payment history</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold capitalize">{currentPlan} Plan</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {subscription.payment_method === "razorpay" ? "Paid via Razorpay" : "Active subscription"}
                  </p>
                </div>
                <Badge className={getSubscriptionStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-secondary)]">Amount</p>
                  <p className="font-semibold">{formatCurrency(subscription.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Started</p>
                  <p className="font-semibold">{formatDate(subscription.starts_at)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Expires</p>
                  <p className="font-semibold">
                    {subscription.expires_at ? formatDate(subscription.expires_at) : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Auto-renew</p>
                  <p className="font-semibold">{subscription.auto_renew ? "Yes" : "No"}</p>
                </div>
              </div>

              {subscription.expires_at && new Date(subscription.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Your subscription expires soon. Renew to continue using premium features.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-semibold text-lg">No Active Subscription</h3>
              <p className="text-[var(--text-secondary)]">Choose a plan to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm">Billing:</span>
            <Button
              variant={billingCycle === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBillingCycle("monthly");
                if (couponCode) setTimeout(() => validateCoupon(), 0);
              }}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "annual" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBillingCycle("annual");
                if (couponCode) setTimeout(() => validateCoupon(), 0);
              }}
            >
              Annual (Save 17%)
            </Button>
          </div>

          {/* Coupon Code */}
          <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Have a coupon code?</span>
            </div>
            {couponData ? (
              <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700">{couponData.code}</Badge>
                  <span className="text-sm text-purple-700">
                    {couponData.discount_type === "free" ? "Free access" : couponData.discount_type === "percent" ? `${couponData.discount_value}% off` : `₹${couponData.discount_value} off`}
                  </span>
                </div>
                <button onClick={removeCoupon} className="text-purple-400 hover:text-purple-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                />
                <Button
                  variant="outline"
                  onClick={validateCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? "..." : "Apply"}
                </Button>
              </div>
            )}
            {couponError && <p className="text-sm text-red-600 mt-1">{couponError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.filter(p => p.slug !== "free").map((plan) => {
              const basePrice = billingCycle === "annual" ? plan.annual : plan.monthly;
              const discountedPrice = couponData ? (() => {
                if (couponData.discount_type === "free") return 0;
                if (couponData.discount_type === "percent") return Math.round(basePrice * (1 - couponData.discount_value / 100));
                if (couponData.discount_type === "fixed") return Math.max(0, basePrice - couponData.discount_value);
                return basePrice;
              })() : null;
              const price = discountedPrice ?? basePrice;
              const isCurrent = currentPlan === plan.slug;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.slug}
                  className={`p-4 border rounded-lg ${isCurrent ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 text-${plan.color}-600`} />
                    <h4 className="font-semibold">{plan.name}</h4>
                    {isCurrent && <Badge>Current</Badge>}
                  </div>
                  <div className="mt-2">
                    {discountedPrice !== null && discountedPrice !== basePrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(price)}<span className="text-sm text-[var(--text-secondary)]">/{billingCycle === "annual" ? "year" : "month"}</span>
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(basePrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">
                        {formatCurrency(price)}<span className="text-sm text-[var(--text-secondary)]">/{billingCycle === "annual" ? "year" : "month"}</span>
                      </span>
                    )}
                  </div>
                  {billingCycle === "annual" && plan.monthly * 12 > plan.annual && (
                    <p className="text-xs text-green-600 mt-1">
                      Save {Math.max(0, Math.round((1 - plan.annual / (plan.monthly * 12)) * 100))}%
                    </p>
                  )}
                  {!isCurrent && (
                    <Button
                      className="w-full mt-4"
                      size="sm"
                      disabled={upgrading === plan.slug}
                      onClick={() => handleUpgrade(plan.slug)}
                    >
                      {upgrading === plan.slug ? "Processing..." : "Upgrade"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center py-8 text-[var(--text-secondary)]">No payment history yet</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-[var(--surface-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-[var(--text-secondary)]" />
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {payment.razorpay_payment_id || payment.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPaymentStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
