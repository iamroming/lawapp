"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Lock, Tag, X } from "lucide-react";
import toast from "react-hot-toast";

const plans = [
  {
    name: "Solo",
    slug: "solo",
    price: 299,
    description: "For solo practitioners",
    features: ["20 active cases", "1 user", "1 GB storage", "E-filing", "Court tracking", "Invoicing"],
    highlighted: false,
  },
  {
    name: "Professional",
    slug: "professional",
    price: 799,
    description: "For established lawyers and small teams",
    features: ["Up to 50 cases", "3 users", "3 GB storage", "AI research", "Client portal", "GST invoicing"],
    highlighted: true,
  },
  {
    name: "Firm",
    slug: "firm",
    price: 1999,
    description: "For law firms needing full team access",
    features: ["Up to 100 cases", "10 users", "7 GB storage", "Admin controls", "Custom reports", "API access"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: 4999,
    description: "For large firms with advanced needs",
    features: ["Up to 500 cases", "50 users", "20 GB storage", "SSO/SAML", "Dedicated manager", "SLA guarantee"],
    highlighted: false,
  },
];

function SubscriptionRequiredContent() {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [startingTrial, setStartingTrial] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const autoSelectedRef = React.useRef(false);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponData(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, billingCycle: "monthly" }),
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

  const handleSelect = async (planSlug: string, price: number) => {
    setSelecting(planSlug);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, billingCycle: "monthly", couponCode: couponData?.code || null }),
      });
      const orderData = await orderRes.json();
      if (orderData.error) {
        if (orderData.error.includes("already have an active subscription")) {
          toast.success("You already have an active subscription!");
          router.push("/dashboard");
          return;
        }
        toast.error(orderData.error);
        setSelecting(null);
        return;
      }

      // Free coupon — subscription activated directly
      if (orderData.free) {
        toast.success(`Subscription activated! ${orderData.discount || ""}`);
        router.push("/dashboard");
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "CaseFiles",
          description: `${orderData.planName} Plan (monthly)${orderData.discount ? ` - ${orderData.discount}` : ""}`,
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
                billingCycle: "monthly",
                couponCode: couponData?.code || null,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment successful! Subscription activated.");
              router.push("/dashboard");
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
            setSelecting(null);
          },
          theme: { color: "#4f46e5" },
        });
        rzp.open();
      };
      document.body.appendChild(script);
      return;
    } catch {
      toast.error("Failed to start subscription");
    }
    setSelecting(null);
  };

  const handleSignOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }
      const idToken = await user.getIdToken();
      const res = await fetch("/api/subscriptions/trial", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("already have an active subscription")) {
          toast.success("You already have an active subscription!");
          router.push("/dashboard");
          return;
        }
        toast.error(data.error || "Failed to start trial");
        return;
      }
      toast.success("14-day free trial activated! Welcome to CaseFiles.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to start trial");
    }
    setStartingTrial(false);
  };

  useEffect(() => {
    if (autoSelectedRef.current) return;
    const planSlug = searchParams.get("plan");
    if (!planSlug) return;
    const plan = plans.find(p => p.slug === planSlug);
    if (!plan) return;
    autoSelectedRef.current = true;
    if (plan.price > 0) {
      setSelecting(plan.slug);
      return;
    }
    fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: plan.slug, billingCycle: "monthly" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
        } else {
          router.push("/dashboard");
        }
      })
      .catch(() => toast.error("Failed to start subscription"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkExistingSubscription = async () => {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) return;
        const { subscription } = await res.json();
        if (subscription) {
          toast.success("You already have an active subscription!");
          router.push("/dashboard");
        }
      } catch {}
    };
    checkExistingSubscription();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <Lock className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {reason === "trial_expired" ? "Your Trial Has Expired" : reason === "firm_owner_required" ? "Firm Subscription Required" : "Select Your Plan"}
          </h1>
          <p className="mt-2 text-gray-600">
            {reason === "trial_expired"
              ? "Your 14-day free trial has ended. Choose a plan to continue using CaseFiles."
              : reason === "firm_owner_required"
              ? "Your firm owner needs to activate or renew a subscription before you can access CaseFiles. Please contact your firm administrator."
              : "Choose a plan to continue using CaseFiles"}
          </p>
        </div>

        {reason !== "firm_owner_required" && (
          <>
            {/* Free Trial Banner */}
            <div className="mb-6 p-6 border-2 border-green-300 rounded-xl bg-green-50 text-center">
              <h3 className="text-lg font-bold text-green-800">Start with a 14-day Free Trial</h3>
              <p className="mt-1 text-sm text-green-700">Full access to Solo plan features. No credit card required.</p>
              <Button
                onClick={handleStartTrial}
                disabled={startingTrial}
                className="mt-3 bg-green-600 text-white hover:bg-green-500 font-semibold px-8"
              >
                {startingTrial ? "Starting..." : "Start Free Trial"}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-3 text-gray-500">or choose a paid plan</span>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-xl bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Have a coupon code?</span>
              </div>
              {couponData ? (
                <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-700">{couponData.code}</span>
                    <span className="text-sm text-purple-600">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`relative flex flex-col rounded-xl border-2 p-5 bg-white ${
                plan.highlighted
                  ? "border-indigo-600 shadow-lg scale-[1.02]"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Recommended
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                {couponData ? (() => {
                  const basePrice = plan.price;
                  let discountedPrice = basePrice;
                  if (couponData.discount_type === "free") discountedPrice = 0;
                  else if (couponData.discount_type === "percent") discountedPrice = Math.round(basePrice * (1 - couponData.discount_value / 100));
                  else if (couponData.discount_type === "fixed") discountedPrice = Math.max(0, basePrice - couponData.discount_value);
                  if (discountedPrice !== basePrice) {
                    return (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-gray-500">₹</span>
                        <span className="text-2xl font-bold text-green-600">{discountedPrice.toLocaleString("en-IN")}</span>
                        <span className="text-sm text-gray-500">/month</span>
                        <span className="text-sm text-gray-400 line-through">₹{basePrice.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-500">₹</span>
                      <span className="text-2xl font-bold text-gray-900">{basePrice.toLocaleString("en-IN")}</span>
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                  );
                })() : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <span className="text-2xl font-bold text-gray-900">{plan.price.toLocaleString("en-IN")}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelect(plan.slug, plan.price)}
                disabled={selecting !== null}
                className={`mt-4 w-full ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {selecting === plan.slug ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  `Select ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>
          </>
        )}

        <div className="mt-8 text-center">
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionRequiredPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SubscriptionRequiredContent />
    </React.Suspense>
  );
}
