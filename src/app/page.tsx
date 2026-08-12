"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  FileText,
  Users,
  Calendar,
  Brain,
  Shield,
  IndianRupee,
  Zap,
  Building2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Star,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const features = [
  {
    icon: FileText,
    title: "Smart Case Management",
    desc: "Track every case with auto-numbering, status flows, hearing dates, and one-click e-filing integration.",
  },
  {
    icon: Users,
    title: "Client Portal",
    desc: "Give your clients real-time case updates, document sharing, and secure messaging — without phone calls.",
  },
  {
    icon: Calendar,
    title: "Court Calendar",
    desc: "Never miss a hearing. Auto-sync with eCourts, cause lists, and get reminders via WhatsApp & SMS.",
  },
  {
    icon: Brain,
    title: "AI Legal Research",
    desc: "Search IPC, CrPC, CPC, and 50,000+ judgments in seconds. Get case summaries and draft suggestions.",
  },
  {
    icon: IndianRupee,
    title: "GST Invoicing",
    desc: "Generate professional GST-compliant invoices, track payments, send reminders, and manage trust accounts.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "AES-256 encryption, DPDP Act compliant, data stored in India. Your clients' data is safe with us.",
  },
];

const stats = [
  { value: "2,500+", label: "Lawyers Trust CaseFiles" },
  { value: "15,000+", label: "Cases Managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9/5", label: "Client Rating" },
];

const solutions = [
  {
    tag: "Solo Practice",
    tagClass: "bg-blue-500/15 text-blue-400",
    title: "For Individual Advocates",
    desc: "Manage your entire practice from one dashboard. Track cases, court dates, and clients without the overhead.",
    items: ["Auto-numbering for all case types", "WhatsApp reminders for hearings", "Quick invoice generation", "AI research for case preparation"],
  },
  {
    tag: "Small Firm",
    tagClass: "bg-purple-500/15 text-purple-400",
    title: "For Growing Law Firms",
    desc: "Collaborate with your team, assign cases, and track billing across multiple advocates.",
    items: ["Multi-user access with roles", "Case assignment & tracking", "Team activity logs", "Shared document library"],
  },
  {
    tag: "Enterprise",
    tagClass: "bg-orange-500/15 text-orange-400",
    title: "For Large Firms & Chambers",
    desc: "Full control with admin panels, custom branding, API access, and dedicated support.",
    items: ["Unlimited users & cases", "Custom branding & white-label", "API access & integrations", "Dedicated account manager"],
  },
  {
    tag: "Legal Teams",
    tagClass: "bg-green-500/15 text-green-400",
    title: "For Litigation Teams",
    desc: "Coordinate across multiple cases, share research, and manage court appearances efficiently.",
    items: ["Multi-case coordination", "Shared research notes", "Court appearance scheduling", "Client communication hub"],
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    desc: "Try it out, no strings attached",
    features: ["3 active cases", "1 user", "100 MB storage", "5 AI queries/month"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Solo",
    price: "₹299",
    period: "/month",
    desc: "Billed monthly",
    features: ["20 active cases", "1 user", "1 GB storage", "E-filing integration", "Invoice generation", "50 AI queries/month"],
    cta: "Start 14-Day Trial",
    highlighted: false,
    monthly: 299,
    annual: 2999,
  },
  {
    name: "Professional",
    price: "₹799",
    period: "/month",
    desc: "Billed monthly",
    features: ["Unlimited cases", "3 users included", "3 GB storage", "AI research & drafting", "Full client portal", "GST invoicing", "Priority support"],
    cta: "Start 14-Day Trial",
    highlighted: true,
    monthly: 799,
    annual: 7999,
  },
  {
    name: "Firm",
    price: "₹1,999",
    period: "/month",
    desc: "Billed monthly",
    features: ["Unlimited cases", "10 users included", "7 GB storage", "Admin controls", "Custom reports", "Audit logging"],
    cta: "Start 14-Day Trial",
    highlighted: false,
    monthly: 1999,
    annual: 19999,
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "/month",
    desc: "Billed monthly",
    features: ["Unlimited everything", "Unlimited users", "Unlimited storage", "Dedicated account manager", "Custom integrations", "White-label options"],
    cta: "Contact Sales",
    highlighted: false,
    monthly: 4999,
    annual: 49999,
  },
];

const testimonials = [
  { name: "Adv. Priya Sharma", firm: "Sharma & Associates, Delhi", initials: "PS", text: "CaseFiles replaced 5 different tools we were using. The AI research alone saves me 3 hours every day. It's like having a junior associate who never sleeps." },
  { name: "Adv. Rajesh Kumar", firm: "Kumar Legal, Mumbai", initials: "RK", text: "Our clients love the portal. They stopped calling for updates — everything is right there on their phone. It has professionalism to our practice." },
  { name: "Adv. Anita Desai", firm: "Desai Law Chambers, Bangalore", initials: "AD", text: "The court calendar integration is a game-changer. We haven't missed a single hearing since switching. Our entire team is now on CaseFiles." },
  { name: "Adv. Vikram Mehta", firm: "Mehta & Co., Chennai", initials: "VM", text: "As a solo practitioner, CaseFiles gives me the tools that only large firms had. The GST invoicing alone pays for the subscription many times over." },
  { name: "Adv. Sanjay Gupta", firm: "Gupta & Partners, Hyderabad", initials: "SG", text: "We moved from spreadsheets to CaseFiles overnight. The team collaboration features are exactly what our 15-person firm needed. Excellent support too." },
  { name: "Adv. Nalini Patil", firm: "Patil Criminal Law, Pune", initials: "NP", text: "The AI legal research feature found a landmark judgment that completely changed our strategy. CaseFiles is now indispensable for our criminal practice." },
];

export default function RootLandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setChecking(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-7 w-7 text-orange-500" />
            <span className="text-xl font-bold">CaseFiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Product</a>
            <a href="#solution" className="hover:text-white transition-colors">Solution</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            {checking ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : loggedIn ? (
              <Link
                href="/dashboard"
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
            <button
              className="md:hidden text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Product</a>
            <a href="#solution" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Solution</a>
            <a href="#pricing" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/blog" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <a href="#testimonials" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-black to-black" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-400">Built for Indian Lawyers</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Run Your Practice
            <br />
            <span className="text-orange-500">Like a Law Firm</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            The all-in-one platform for Indian advocates. Manage cases, clients, billing, court dates, and AI-powered research — from your phone or laptop.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#pricing"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-orange-500">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to
              <span className="text-orange-500"> Practice Better</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              From case intake to final billing — one platform that replaces your entire toolkit.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-orange-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <f.icon className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solution" className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Built for <span className="text-orange-500">Every Practice</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Whether you&apos;re a solo advocate or a full-service firm, CaseFiles scales with you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {solutions.map((s) => (
              <div
                key={s.title}
                className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-orange-500/30 transition-all"
              >
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${s.tagClass}`}>
                  {s.tag}
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{s.desc}</p>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Get Started in <span className="text-orange-500">3 Steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Your Firm", desc: "Sign up, enter your firm details, and invite your team members with a simple invite code." },
              { step: "02", title: "Add Your Cases", desc: "Import existing cases or create new ones. Link them to clients, documents, and court dates." },
              { step: "03", title: "Manage Everything", desc: "Track hearings, generate invoices, research with AI, and grow your practice — all in one place." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-orange-500/30 mb-4">{s.step}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, <span className="text-orange-500">Transparent</span> Pricing
            </h2>
            <p className="mt-4 text-gray-400">Start free. Upgrade when you need more. No hidden fees.</p>
          </div>
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-gray-500"}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-12 h-7 rounded-full transition-colors ${isAnnual ? "bg-orange-500" : "bg-white/20"}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? "left-6" : "left-1"}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-white" : "text-gray-500"}`}>
              Annual <span className="text-green-400 text-xs font-semibold">Save 17%</span>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {plans.map((p) => {
              const displayPrice = p.monthly
                ? isAnnual
                  ? `₹${Math.round(p.annual! / 12).toLocaleString("en-IN")}`
                  : `₹${p.monthly.toLocaleString("en-IN")}`
                : p.price;
              const displayDesc = p.monthly
                ? isAnnual
                  ? `Billed ₹${p.annual!.toLocaleString("en-IN")}/year`
                  : "Billed monthly"
                : p.desc;
              return (
                <div
                  key={p.name}
                  className={`relative rounded-2xl p-6 border transition-all ${
                    p.highlighted
                      ? "border-orange-500 bg-orange-500/5 sm:scale-105"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{displayPrice}</span>
                    {p.period && <span className="text-sm text-gray-500">{p.period}</span>}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{displayDesc}</div>
                  <ul className="mt-5 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.name === "Enterprise" ? "/contact" : "/signup"}
                    className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      p.highlighted
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border border-white/20 hover:border-white/40 text-white"
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Loved by <span className="text-orange-500">Lawyers</span> Across India
            </h2>
            <p className="mt-4 text-gray-400">See what advocates are saying about CaseFiles.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-orange-500/30 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-orange-500 fill-orange-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-sm font-bold text-orange-500">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.firm}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Transform<br />Your Practice?
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Join 2,500+ lawyers who manage their entire practice with CaseFiles.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-bold">CaseFiles</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/help" className="hover:text-white transition-colors">Help</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <div className="text-sm text-gray-600">
              &copy; 2026 CaseFiles. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
