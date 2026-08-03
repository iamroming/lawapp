"use client";

import Link from "next/link";
import {
  Briefcase,
  Users,
  Receipt,
  Calendar,
  FolderOpen,
  Bot,
  ArrowRight,
  Scale,
  Shield,
  Clock,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Case Management",
    description:
      "Track every case from filing to resolution. Organize by court, client, or status with powerful filters and search.",
  },
  {
    icon: Users,
    title: "Client Portal",
    description:
      "Give clients a secure portal to view case updates, upload documents, and communicate with your team.",
  },
  {
    icon: Receipt,
    title: "Billing & Invoicing",
    description:
      "Generate professional invoices, track payments, and manage your firm's finances with built-in accounting tools.",
  },
  {
    icon: Calendar,
    title: "Court Calendar",
    description:
      "Never miss a hearing. Sync court dates with Google Calendar and get automatic reminders before every appearance.",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Store, organize, and retrieve case documents instantly. Version control and secure access for your entire team.",
  },
  {
    icon: Bot,
    title: "AI Legal Assistant",
    description:
      "Draft contracts, summarize case law, and get legal research assistance powered by artificial intelligence.",
  },
];

const testimonials = [
  {
    name: "Adv. Priya Sharma",
    role: "Senior Partner, Sharma & Associates",
    quote:
      "LawXP has transformed how we manage our practice. We've reduced administrative time by 40% and never miss a court date anymore.",
    rating: 5,
  },
  {
    name: "Adv. Rajesh Kumar",
    role: "Solo Practitioner, Delhi",
    quote:
      "As a solo practitioner, I needed something affordable yet powerful. LawXP gives me enterprise-level tools at a fraction of the cost.",
    rating: 5,
  },
  {
    name: "Adv. Meera Patel",
    role: "Managing Partner, Patel Legal Group",
    quote:
      "The AI legal assistant alone has saved us dozens of hours on legal research. The client portal has also improved our client satisfaction significantly.",
    rating: 5,
  },
];

const stats = [
  { value: "1,000+", label: "Lawyers Trust Us" },
  { value: "10,000+", label: "Cases Managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9/5", label: "Customer Rating" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Scale className="h-4 w-4" />
              Built for the Indian Legal System
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Modern Legal Practice
              <br />
              <span className="text-indigo-600">Management for Indian Lawyers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              Manage cases, clients, billing, court dates, and documents — all in one
              powerful platform designed specifically for advocates and law firms in India.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-purple-100/50 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Run Your Practice
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              From case intake to final billing, LawXP covers every aspect of legal
              practice management.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by Lawyers Across India
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              See what legal professionals are saying about LawXP.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6">
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Modernize Your Legal Practice?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            Join 1,000+ lawyers who are already using LawXP to manage their practice
            more efficiently.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
