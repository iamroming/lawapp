import Link from "next/link";
import {
  Scale,
  FileText,
  Users,
  Calendar,
  Brain,
  Shield,
  ChevronRight,
  IndianRupee,
  Gavel,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Building2,
} from "lucide-react";

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

const testimonials = [
  {
    name: "Adv. Priya Sharma",
    firm: "Sharma & Associates, Delhi",
    text: "CaseFiles replaced 5 different tools we were using. The AI research alone saves me 3 hours every day.",
  },
  {
    name: "Adv. Rajesh Kumar",
    firm: "Kumar Legal, Mumbai",
    text: "Our clients love the portal. They stopped calling for updates — everything is right there on their phone.",
  },
  {
    name: "Adv. Anita Desai",
    firm: "Desai Law Chambers, Bangalore",
    text: "The court calendar integration is a game-changer. We haven't missed a single hearing since switching.",
  },
];

export default function HomePage() {
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
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
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
            <Link
              href="/pricing"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-lg text-lg transition-colors"
            >
              View Pricing
            </Link>
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

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
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

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, <span className="text-orange-500">Transparent</span> Pricing
            </h2>
            <p className="mt-4 text-gray-400">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Free", price: "₹0", desc: "Try it out", features: ["3 cases", "1 user", "200 MB storage"], cta: "Get Started" },
              { name: "Professional", price: "₹799", desc: "/month", features: ["Unlimited cases", "3 users", "3 GB storage", "AI research"], cta: "Start Trial", highlighted: true },
              { name: "Firm", price: "₹1,999", desc: "/month", features: ["Unlimited everything", "10 users", "7 GB storage", "Admin controls"], cta: "Start Trial" },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${
                  p.highlighted
                    ? "border-orange-500 bg-orange-500/5 scale-105"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {p.highlighted && (
                  <div className="text-xs font-semibold text-orange-500 mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-gray-500">{p.desc}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-orange-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    p.highlighted
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border border-white/20 hover:border-white/40 text-white"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-orange-500 hover:text-orange-400 text-sm font-medium inline-flex items-center gap-1">
              View all plans <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Loved by <span className="text-orange-500">Lawyers</span> Across India
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.firm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Transform Your Practice?
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
              <Link href="/help" className="hover:text-white transition-colors">Help</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <div className="text-sm text-gray-600">
              © 2026 CaseFiles. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
