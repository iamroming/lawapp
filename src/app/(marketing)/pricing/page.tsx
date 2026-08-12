"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    name: "Solo",
    slug: "solo",
    monthlyPrice: 299,
    annualPrice: 2999,
    description: "For solo practitioners handling a growing caseload.",
    highlighted: false,
    features: [
      { text: "1 user", included: true },
      { text: "20 active cases", included: true },
      { text: "1 GB storage", included: true },
      { text: "Basic case tracking", included: true },
      { text: "Court calendar", included: true },
      { text: "E-filing integration", included: true },
      { text: "Court tracking", included: true },
      { text: "Invoice generation", included: true },
      { text: "Email reminders", included: true },
      { text: "Client portal (read-only)", included: true },
      { text: "50 AI queries/month", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    extraUserPrice: null,
  },
  {
    name: "Professional",
    slug: "professional",
    monthlyPrice: 799,
    annualPrice: 7999,
    description: "For established lawyers and small teams.",
    highlighted: true,
    features: [
      { text: "Up to 3 users included", included: true },
      { text: "Up to 50 active cases", included: true },
      { text: "3 GB storage", included: true },
      { text: "Everything in Solo", included: true },
      { text: "Full client portal", included: true },
      { text: "GST invoicing + payment links", included: true },
      { text: "200 AI queries/month", included: true },
      { text: "AI drafting + chatbot", included: true },
      { text: "Team collaboration", included: true },
      { text: "Court cause list tracking", included: true },
      { text: "Expense tracking + timesheets", included: true },
      { text: "Reports + analytics", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    extraUserPrice: null,
  },
  {
    name: "Firm",
    slug: "firm",
    monthlyPrice: 1999,
    annualPrice: 19999,
    description: "For law firms that need full team access.",
    highlighted: false,
    features: [
      { text: "Up to 10 users included", included: true },
      { text: "Up to 100 active cases", included: true },
      { text: "7 GB storage", included: true },
      { text: "Everything in Professional", included: true },
      { text: "Unlimited AI queries", included: true },
      { text: "Admin controls", included: true },
      { text: "Bulk operations", included: true },
      { text: "Custom reports", included: true },
      { text: "Custom branding", included: true },
      { text: "Priority support", included: true },
      { text: "Audit logging", included: true },
      { text: "API access", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    extraUserPrice: null,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthlyPrice: 4999,
    annualPrice: 49999,
    description: "For large firms and organizations with unlimited needs.",
    highlighted: false,
    features: [
      { text: "Up to 50 users", included: true },
      { text: "Up to 500 active cases", included: true },
      { text: "20 GB storage", included: true },
      { text: "Everything in Firm", included: true },
      { text: "150 AI queries/month", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "White-label options", included: true },
      { text: "SSO / SAML", included: true },
      { text: "SLA guarantee", included: true },
      { text: "On-premise deployment", included: true },
      { text: "Training & onboarding", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    extraUserPrice: null,
  },
];

const comparison = [
  { feature: "Users Included", solo: "1", professional: "3", firm: "10", enterprise: "50" },
  { feature: "Active Cases", solo: "20", professional: "50", firm: "100", enterprise: "500" },
  { feature: "Storage", solo: "1 GB", professional: "3 GB", firm: "7 GB", enterprise: "20 GB" },
  { feature: "Client Portal", solo: "Read-only", professional: "Full Access", firm: "Full Access", enterprise: "Full Access" },
  { feature: "Invoicing", solo: "Basic", professional: "GST + Payments", firm: "GST + Payments", enterprise: "GST + Payments" },
  { feature: "AI Queries", solo: "50/mo", professional: "200/mo", firm: "Unlimited", enterprise: "150/mo" },
  { feature: "E-filing", solo: "✓", professional: "✓", firm: "✓", enterprise: "✓" },
  { feature: "Court Tracking", solo: "✓", professional: "✓", firm: "✓", enterprise: "✓" },
  { feature: "AI Drafting", solo: "—", professional: "✓", firm: "✓", enterprise: "✓" },
  { feature: "Team Collaboration", solo: "—", professional: "✓", firm: "✓", enterprise: "✓" },
  { feature: "Expense Tracking", solo: "—", professional: "✓", firm: "✓", enterprise: "✓" },
  { feature: "Custom Branding", solo: "—", professional: "—", firm: "✓", enterprise: "✓" },
  { feature: "Admin Controls", solo: "—", professional: "—", firm: "✓", enterprise: "✓" },
  { feature: "Custom Reports", solo: "—", professional: "—", firm: "✓", enterprise: "✓" },
  { feature: "API Access", solo: "—", professional: "—", firm: "✓", enterprise: "✓" },
  { feature: "SSO / SAML", solo: "—", professional: "—", firm: "—", enterprise: "✓" },
  { feature: "Dedicated Account Manager", solo: "—", professional: "—", firm: "—", enterprise: "✓" },
  { feature: "Custom Integrations", solo: "—", professional: "—", firm: "—", enterprise: "✓" },
  { feature: "SLA Guarantee", solo: "—", professional: "—", firm: "—", enterprise: "✓" },
  { feature: "Support", solo: "Email", professional: "Priority Email", firm: "Priority Support", enterprise: "Dedicated Manager" },
];

const addOns = [
  { name: "Extra Storage", price: "Rs 200/mo", detail: "Per 50 GB bundle" },
  { name: "Extra AI Credits", price: "Rs 300", detail: "Per 500 queries" },
  { name: "WhatsApp Reminders", price: "Rs 199/mo", detail: "Per firm" },
  { name: "SMS Reminders", price: "Rs 99/mo", detail: "Per firm" },
  { name: "Priority Support", price: "Rs 499/mo", detail: "Per firm" },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade at any time. Upgrading takes effect immediately with prorated billing. Downgrading takes effect at the end of your current billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! All paid plans come with a 14-day free trial. No credit card required. You get full access to all features in your chosen plan during the trial.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI, net banking, and NEFT/RTGS transfers via Razorpay. All payments are in INR with GST invoices.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual billing saves you approximately 17% (2 months free). You pay for 12 months upfront and get uninterrupted access. You can switch to annual billing from your settings anytime.",
  },
  {
    q: "What happens when I reach my case or storage limit?",
    a: "You'll receive a notification when you're near your limit. You can either upgrade your plan or purchase add-ons for additional storage. You won't lose access to existing data.",
  },
  {
    q: "How does the AI legal assistant work?",
    a: "Our AI is trained on Indian legal databases including IPC, CrPC, CPC, and landmark Supreme Court judgments. It helps with legal research, contract drafting, case summaries, and more.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use AES-256 encryption, SOC 2 compliant infrastructure, and all data is stored in India. We're DPDP Act compliant and never share your data with third parties.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a full refund within 7 days of purchase if you're not satisfied. After that, you can cancel anytime and retain access until the end of your billing period.",
  },
];

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export default function PricingPage() {
  const { user: appUser } = useUser();
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    setIsLoggedIn(!!appUser);
  }, [appUser]);

  const handleSelectPlan = async (planSlug: string, planPrice: number) => {
    if (!isLoggedIn) {
      document.cookie = `selected_plan=${planSlug}; path=/; max-age=604800`;
      router.push("/signup");
      return;
    }

    setSelectingPlan(planSlug);

    try {
      // Paid plan - Razorpay Checkout
      const billingCycle = annual ? "annual" : "monthly";

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, billingCycle }),
      });
      const orderData = await orderRes.json();

      if (orderData.error) {
        toast.error(orderData.error);
        setSelectingPlan(null);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => openRazorpayCheckout(orderData, planSlug, billingCycle);
      script.onerror = () => {
        toast.error("Failed to load payment gateway");
        setSelectingPlan(null);
      };
      document.body.appendChild(script);
    } catch {
      toast.error("Failed to start payment");
      setSelectingPlan(null);
    }
  };

  const openRazorpayCheckout = (orderData: any, planSlug: string, billingCycle: string) => {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "CaseFiles",
      description: `${orderData.planName} Plan (${billingCycle})`,
      order_id: orderData.orderId,
      handler: async (response: any) => {
        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planSlug,
              billingCycle,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            toast.success("Payment successful! Subscription activated.");
            router.push("/dashboard");
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
        } catch {
          toast.error("Payment verification failed. Contact support.");
        }
        setSelectingPlan(null);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#4f46e5",
      },
      modal: {
        ondismiss: () => {
          setSelectingPlan(null);
          toast.error("Payment cancelled");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Choose the plan that fits your practice. All paid plans include a 14-day free trial.
            No credit card required.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                annual ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  annual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-500"}`}>
              Annual
              <span className="ml-1.5 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Save 17%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEquiv = annual
                ? Math.round(plan.annualPrice / 12)
                : plan.monthlyPrice;

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                    plan.highlighted
                      ? "border-indigo-600 shadow-xl scale-[1.02]"
                      : "border-gray-200 shadow-sm"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(monthlyEquiv)}
                    </span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <p className="mt-1 text-xs text-green-600 font-medium">
                      Billed ₹{formatPrice(price)}/year (save {Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100)}%)
                    </p>
                  )}
                  {!annual && plan.monthlyPrice > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Billed monthly
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <p className="mt-1 text-xs text-green-600 font-medium">
                      Free forever
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-sm">
                        {f.included ? (
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                        )}
                        <span className={f.included ? "text-gray-700" : "text-gray-400"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.slug, plan.monthlyPrice)}
                    disabled={selectingPlan === plan.slug}
                    className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    {selectingPlan === plan.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 sm:text-3xl">
            Add-ons
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Enhance your plan with additional features
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addOns.map((addon) => (
              <div key={addon.name} className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                <p className="mt-1 text-2xl font-bold text-indigo-600">{addon.price}</p>
                <p className="mt-1 text-sm text-gray-500">{addon.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 sm:text-3xl">
            Feature Comparison
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 pr-4 font-semibold text-gray-900">Feature</th>
                    <th className="px-4 py-3 font-semibold text-gray-900">Solo</th>
                    <th className="px-4 py-3 font-semibold text-indigo-600">Professional</th>
                    <th className="px-4 py-3 font-semibold text-gray-900">Firm</th>
                    <th className="pl-4 py-3 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.feature} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-700 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-gray-600">{row.solo}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{row.professional}</td>
                      <td className="px-4 py-3 text-gray-600">{row.firm}</td>
                      <td className="pl-4 py-3 text-gray-600">{row.enterprise}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 overflow-hidden bg-white"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  {openFaq === i ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
