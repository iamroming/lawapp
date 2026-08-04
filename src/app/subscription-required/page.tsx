"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Scale, Lock } from "lucide-react";
import toast from "react-hot-toast";

const plans = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    description: "Try LawXP with basic features",
    features: ["3 active cases", "1 user", "100 MB storage", "Basic dashboard"],
    highlighted: false,
  },
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
    features: ["Unlimited cases", "3 users", "5 GB storage", "AI research", "Client portal", "GST invoicing"],
    highlighted: true,
  },
  {
    name: "Firm",
    slug: "firm",
    price: 1999,
    description: "For law firms needing full team access",
    features: ["Unlimited cases", "10 users", "20 GB storage", "Admin controls", "Custom reports", "API access"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: 4999,
    description: "For large firms with custom needs",
    features: ["Unlimited everything", "Unlimited users", "Unlimited storage", "Dedicated support", "Custom integrations"],
    highlighted: false,
  },
];

export default function SubscriptionRequiredPage() {
  const [selecting, setSelecting] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSelect = async (planSlug: string, price: number) => {
    setSelecting(planSlug);
    try {
      const postBody = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, billingCycle: "monthly" }),
      };

      if (price === 0) {
        const res = await fetch("/api/subscriptions", postBody);
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
          setSelecting(null);
          return;
        }
        toast.success("Free plan activated!");
        router.push("/dashboard");
        return;
      }

      const res = await fetch("/api/subscriptions", postBody);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.short_url) {
        window.location.href = data.short_url;
      } else {
        toast.success("Subscription created!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to start subscription");
    }
    setSelecting(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <Lock className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Select Your Plan</h1>
          <p className="mt-2 text-gray-600">Choose a plan to continue using LawXP</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm text-gray-500">₹</span>
                <span className="text-2xl font-bold text-gray-900">
                  {plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-gray-500">/month</span>
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
                ) : plan.price === 0 ? (
                  "Select Free Plan"
                ) : (
                  `Select ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
