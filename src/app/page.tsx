"use client";

import { useState, useEffect, useRef } from "react";
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
  Menu,
  X,
  Clock,
  MessageSquare,
  BarChart3,
  Search,
  Bell,
  Globe,
  Smartphone,
  ChevronLeft,
  Briefcase,
  Heart,
  Headphones,
  Lock,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const featureShowcase = [
  { icon: FileText, title: "Client Intake Forms", desc: "Send customizable online intake forms to new clients." },
  { icon: MessageSquare, title: "Client Portal", desc: "24/7 secure portal that builds trust and cuts outreach." },
  { icon: Calendar, title: "Court Calendar", desc: "Combine all appointments, meetings, and events into one calendar." },
  { icon: FileText, title: "Document Management", desc: "Generate documents for client cases. Auto-populate with client details." },
  { icon: Brain, title: "AI Legal Research", desc: "Extract facts, summarize documents, and surface next steps with AI." },
  { icon: Clock, title: "Time Tracking", desc: "Track time and expenses across client projects." },
  { icon: IndianRupee, title: "GST Invoicing", desc: "Automatically create invoices from tracked time." },
  { icon: BarChart3, title: "Financial Reports", desc: "Real-time analytics on firm financial health and performance." },
];

const detailedFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Legal Research",
    subtitle: "Work smarter with legal AI built into CaseFiles",
    desc: "CaseFiles AI helps you write communications, summarize documents, run OCR on scanned files, and surface next steps. No separate tools, no context switching.",
    items: ["Search 50,000+ Indian judgments", "Auto-summarize case documents", "Draft legal documents with AI", "OCR scanned court papers"],
    color: "orange",
  },
  {
    icon: Users,
    title: "Client Intake & Lead Management",
    subtitle: "Grow faster with smart lead tracking",
    desc: "Get a 360-degree view of your prospective client pipeline. Track leads from first contact through to signing, and see exactly where there's room to grow.",
    items: ["Customizable web intake forms", "Automated retainer agreements", "Lead pipeline tracking", "Client conflict checking"],
    color: "blue",
  },
  {
    icon: FileText,
    title: "Complete Case Management",
    subtitle: "Stay organized with everything in one place",
    desc: "From calendaring and communications to document management and case reporting, keep track of every detail without falling behind.",
    items: ["Centralized court calendar", "Secure document management", "Client portal & messaging", "Case analytics & reporting"],
    color: "purple",
  },
  {
    icon: IndianRupee,
    title: "Billing & Payments",
    subtitle: "Get paid faster with integrated billing",
    desc: "One solution for all your firm's billing and payment needs. Track time and simplify essential tasks from one convenient hub.",
    items: ["Capture every billable minute", "Automated invoice generation", "Online payment acceptance", "Financial analytics reports"],
    color: "green",
  },
];

const barAssociationLogos = [
  "Bar Council of India",
  "Delhi High Court Bar",
  "Bombay Bar Association",
  "Madras Bar Association",
  "Karnataka Bar Council",
  "Calcutta High Court Bar",
];

const testimonials = [
  { name: "Adv. Priya Sharma", firm: "Sharma & Associates, Delhi", initials: "PS", text: "CaseFiles replaced 5 different tools we were using. The AI research alone saves me 3 hours every day.", rating: 5 },
  { name: "Adv. Rajesh Kumar", firm: "Kumar Legal, Mumbai", initials: "RK", text: "Our clients love the portal. They stopped calling for updates — everything is right there on their phone.", rating: 5 },
  { name: "Adv. Anita Desai", firm: "Desai Law Chambers, Bangalore", initials: "AD", text: "The court calendar integration is a game-changer. We haven't missed a single hearing since switching.", rating: 5 },
  { name: "Adv. Vikram Mehta", firm: "Mehta & Co., Chennai", initials: "VM", text: "As a solo practitioner, CaseFiles gives me the tools that only large firms had. Incredibly powerful.", rating: 5 },
  { name: "Adv. Sanjay Gupta", firm: "Gupta & Partners, Hyderabad", initials: "SG", text: "We moved from spreadsheets to CaseFiles overnight. The team collaboration features are exactly what we needed.", rating: 5 },
  { name: "Adv. Nalini Patil", firm: "Patil Criminal Law, Pune", initials: "NP", text: "The AI legal research found a landmark judgment that completely changed our strategy. Indispensable.", rating: 5 },
];

const plans = [
  { name: "Free", price: "₹0", desc: "Try it out, no strings attached", features: ["3 active cases", "1 user", "100 MB storage", "5 AI queries/month"], cta: "Get Started", highlighted: false },
  { name: "Solo", price: "₹299", period: "/month", desc: "Billed monthly", features: ["20 active cases", "1 user", "1 GB storage", "E-filing integration", "Invoice generation", "50 AI queries/month"], cta: "Start 14-Day Trial", highlighted: false, monthly: 299, annual: 2999 },
  { name: "Professional", price: "₹799", period: "/month", desc: "Billed monthly", features: ["Unlimited cases", "3 users included", "3 GB storage", "AI research & drafting", "Full client portal", "GST invoicing", "Priority support"], cta: "Start 14-Day Trial", highlighted: true, monthly: 799, annual: 7999 },
  { name: "Firm", price: "₹1,999", period: "/month", desc: "Billed monthly", features: ["Unlimited cases", "10 users included", "7 GB storage", "Admin controls", "Custom reports", "Audit logging"], cta: "Start 14-Day Trial", highlighted: false, monthly: 1999, annual: 19999 },
  { name: "Enterprise", price: "₹4,999", period: "/month", desc: "Billed monthly", features: ["Unlimited everything", "Unlimited users", "Unlimited storage", "Dedicated account manager", "Custom integrations", "White-label options"], cta: "Contact Sales", highlighted: false, monthly: 4999, annual: 49999 },
];

function ROISection() {
  const [cases, setCases] = useState(60);
  const [rate, setRate] = useState(5000);
  const [clients, setClients] = useState(30);

  const savedHours = Math.round(clients * 0.5 * 12);
  const revenueIncrease = Math.round(savedHours * rate);
  const casesGrowth = Math.round(cases * 0.37);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Run a More <span className="text-orange-500">Profitable Firm</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              See how much time and revenue CaseFiles can add to your practice.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Monthly cases</span>
                  <span className="font-semibold">{cases}</span>
                </div>
                <input type="range" min="10" max="200" value={cases} onChange={(e) => setCases(+e.target.value)} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Hourly billable rate</span>
                  <span className="font-semibold">₹{rate.toLocaleString("en-IN")}</span>
                </div>
                <input type="range" min="1000" max="25000" step="500" value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Clients billed monthly</span>
                  <span className="font-semibold">{clients}</span>
                </div>
                <input type="range" min="5" max="100" value={clients} onChange={(e) => setClients(+e.target.value)} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <div className="text-3xl font-bold text-orange-500">₹{revenueIncrease.toLocaleString("en-IN")}</div>
              <div className="mt-1 text-sm text-gray-400">Additional revenue annually</div>
            </div>
            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-500">{casesGrowth}</div>
              <div className="mt-1 text-sm text-gray-400">More cases per year</div>
            </div>
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
              <div className="text-3xl font-bold text-green-500">{savedHours}</div>
              <div className="mt-1 text-sm text-gray-400">Hours saved annually</div>
            </div>
            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-500">37%</div>
              <div className="mt-1 text-sm text-gray-400">More cases, same team</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goTo = (i: number) => {
    setCurrent(i);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
  };

  const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((current + 1) % testimonials.length);

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="overflow-hidden rounded-2xl">
        <div className="p-8 sm:p-12 text-center">
          <div className="flex justify-center gap-0.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-orange-500 fill-orange-500" />
            ))}
          </div>
          <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed mb-8">
            &ldquo;{testimonials[current].text}&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-sm font-bold text-orange-500">
              {testimonials[current].initials}
            </div>
            <div className="text-left">
              <div className="font-semibold">{testimonials[current].name}</div>
              <div className="text-sm text-gray-500">{testimonials[current].firm}</div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-orange-500" : "bg-white/20"}`} />
        ))}
      </div>
    </div>
  );
}

function FeatureDetailSection({ feature, index }: { feature: typeof detailedFeatures[0]; index: number }) {
  const isReversed = index % 2 !== 0;
  const colorMap: Record<string, string> = {
    orange: "from-orange-500/20 to-transparent",
    blue: "from-blue-500/20 to-transparent",
    purple: "from-purple-500/20 to-transparent",
    green: "from-green-500/20 to-transparent",
  };
  const iconBgMap: Record<string, string> = {
    orange: "bg-orange-500/10 text-orange-500",
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
    green: "bg-green-500/10 text-green-500",
  };

  return (
    <section className="py-20 sm:py-28">
      <div className={`max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center ${isReversed ? "lg:direction-rtl" : ""}`}>
        <div className={isReversed ? "lg:order-2" : ""}>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${iconBgMap[feature.color]}`}>
            <feature.icon className="h-4 w-4" />
            {feature.subtitle}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">{feature.title}</h2>
          <p className="mt-4 text-gray-400 text-lg leading-relaxed">{feature.desc}</p>
          <ul className="mt-6 space-y-3">
            {feature.items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className={`relative ${isReversed ? "lg:order-1" : ""}`}>
          <div className={`absolute inset-0 bg-gradient-radial ${colorMap[feature.color]} rounded-3xl blur-3xl opacity-30`} />
          <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12">
            <div className="grid grid-cols-2 gap-4">
              {feature.items.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl ${iconBgMap[feature.color]} bg-opacity-50`}>
                  <feature.icon className="h-8 w-8 mb-2 opacity-80" />
                  <div className="text-sm font-medium">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
            <a href="#solution" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            {checking ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : loggedIn ? (
              <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Try Free
                </Link>
              </>
            )}
            <button className="md:hidden text-white p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Product</a>
            <a href="#solution" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
            <a href="#pricing" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/blog" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <a href="#testimonials" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-black to-black" />
        <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-400">Built for Indian Lawyers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Total Firm Control,
              <br />
              <span className="text-orange-500">From Casework to Cash Flow</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
              Experience the difference between managing your firm and mastering it. Our case management platform transforms how you practice law, from intake to invoice.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#features" className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors">
                See Features
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-3xl blur-3xl" />
            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Sharma vs State of Delhi</div>
                    <div className="text-xs text-gray-500">Next hearing: Tomorrow, 10:30 AM</div>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">Under Trial</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">New Client: Rahul Mehta</div>
                    <div className="text-xs text-gray-500">Intake form submitted 2 hours ago</div>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">New Lead</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Payment Received: ₹15,000</div>
                    <div className="text-xs text-gray-500">Invoice #INV-2024-089</div>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Paid</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">AI Found 3 Similar Cases</div>
                    <div className="text-xs text-gray-500">Based on current case analysis</div>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bar Association Logos */}
      <section className="border-y border-white/10 bg-white/[0.02] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-6">Partnered with leading bar associations across India</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {barAssociationLogos.map((name) => (
              <div key={name} className="flex items-center gap-2 text-gray-600">
                <Scale className="h-5 w-5" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase - Scrolling Cards */}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureShowcase.map((f) => (
              <div key={f.title} className="group p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-orange-500/30 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                  <f.icon className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      {detailedFeatures.map((f, i) => (
        <FeatureDetailSection key={f.title} feature={f} index={i} />
      ))}

      {/* ROI Calculator */}
      <ROISection />

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Get Started in <span className="text-orange-500">3 Simple Steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Your Firm", desc: "Sign up, enter your firm details, and invite your team members with a simple invite code.", icon: Building2 },
              { step: "02", title: "Add Your Cases", desc: "Import existing cases or create new ones. Link them to clients, documents, and court dates.", icon: FileText },
              { step: "03", title: "Manage Everything", desc: "Track hearings, generate invoices, research with AI, and grow your practice — all in one place.", icon: BarChart3 },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">Step {s.step}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Do More Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Do More with <span className="text-orange-500">CaseFiles</span>
            </h2>
            <p className="mt-4 text-gray-400">We have the details covered, so you can worry less.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Easy Onboarding", desc: "Quick, intuitive setup designed for lawyers. Start getting value right away." },
              { icon: Lock, title: "Bank-Grade Security", desc: "AES-256 encryption, DPDP Act compliant, data stored in India." },
              { icon: Globe, title: "Connected to Your Tools", desc: "Integrate with the tools you already use. No double entry." },
              { icon: Smartphone, title: "Mobile First", desc: "Access your firm from anywhere. Full-featured mobile app." },
              { icon: Headphones, title: "Dedicated Support", desc: "Phone, chat, and email support from legal tech experts." },
              { icon: Heart, title: "Trusted by 2,500+ Firms", desc: "Join the growing community of Indian lawyers who trust CaseFiles." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-orange-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
                  <item.icon className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
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
            <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-12 h-7 rounded-full transition-colors ${isAnnual ? "bg-orange-500" : "bg-white/20"}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? "left-6" : "left-1"}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-white" : "text-gray-500"}`}>
              Annual <span className="text-green-400 text-xs font-semibold">Save 17%</span>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {plans.map((p) => {
              const displayPrice = p.monthly ? isAnnual ? `₹${Math.round(p.annual! / 12).toLocaleString("en-IN")}` : `₹${p.monthly.toLocaleString("en-IN")}` : p.price;
              const displayDesc = p.monthly ? isAnnual ? `Billed ₹${p.annual!.toLocaleString("en-IN")}/year` : "Billed monthly" : p.desc;
              return (
                <div key={p.name} className={`relative rounded-2xl p-6 border transition-all ${p.highlighted ? "border-orange-500 bg-orange-500/5 sm:scale-105" : "border-white/10 bg-white/[0.03]"}`}>
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
                  <Link href={p.name === "Enterprise" ? "/contact" : "/signup"} className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${p.highlighted ? "bg-orange-500 hover:bg-orange-600 text-white" : "border border-white/20 hover:border-white/40 text-white"}`}>
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
          <TestimonialCarousel />
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
            <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="border-t border-white/10 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-bold">CaseFiles</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The all-in-one practice management software for Indian lawyers. Manage cases, clients, billing, and court dates from one platform.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Globe className="h-4 w-4 text-gray-400" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#solution" className="hover:text-white transition-colors">Solo Practice</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">Small Firms</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">Enterprise</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">Litigation Teams</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              &copy; 2026 CaseFiles. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/help" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
