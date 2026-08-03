"use client";

import Link from "next/link";
import { ArrowRight, Scale, Heart, Target, Lightbulb } from "lucide-react";

const team = [
  {
    name: "Arjun Mehta",
    role: "CEO & Co-Founder",
    bio: "Former practicing advocate at Bombay High Court. 10+ years in legal tech.",
  },
  {
    name: "Sneha Raghavan",
    role: "CTO & Co-Founder",
    bio: "Ex-Amazon engineer. Built scalable platforms serving millions of users.",
  },
  {
    name: "Vikram Desai",
    role: "Head of Product",
    bio: "Product leader with experience at top SaaS companies in India.",
  },
  {
    name: "Ananya Singh",
    role: "Head of Design",
    bio: "Award-winning designer focused on making complex tools simple.",
  },
];

const values = [
  {
    icon: Heart,
    title: "Lawyer-First Design",
    description: "Every feature is designed with Indian lawyers in mind, addressing their unique challenges and workflows.",
  },
  {
    icon: Target,
    title: "Relentless Quality",
    description: "We obsess over reliability because lawyers can't afford downtime. 99.9% uptime isn't a goal — it's a promise.",
  },
  {
    icon: Lightbulb,
    title: "Innovation with Purpose",
    description: "We use AI and modern technology not for the sake of it, but to solve real problems that waste lawyers' time.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About LawXP
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            We&apos;re building the operating system for Indian law firms — modern software
            designed by lawyers, for lawyers.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Our Story</h2>
          <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
            <p>
              LawXP was born from a simple frustration: Indian lawyers were using a patchwork
              of generic tools — spreadsheets, WhatsApp groups, email chains — to manage
              their practices. Nothing was purpose-built for the unique demands of the
              Indian legal system.
            </p>
            <p>
              Our founders, Arjun and Sneha, experienced this firsthand. Arjun, a practicing
              advocate at Bombay High Court, spent more time on administrative tasks than
              actual lawyering. Sneha, an engineer at Amazon, saw an opportunity to bring
              modern technology to an underserved market.
            </p>
            <p>
              In 2023, they launched LawXP from Mumbai with a simple mission: give Indian
              lawyers the tools they deserve. Today, over 1,000 lawyers across 15 states
              trust LawXP to manage their practices, and we&apos;re just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                To empower every Indian lawyer with modern, affordable technology that
                eliminates administrative burden and lets them focus on what matters most —
                practicing law and serving justice.
              </p>
            </div>
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Our Vision</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                A India where every law firm, from a solo practitioner in a tier-3 city
                to the largest corporate firm in Mumbai, has access to world-class practice
                management tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Our Values
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="text-center">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Meet the Team
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
            A small but passionate team committed to transforming legal practice in India.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100"
              >
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-indigo-600 font-medium">{member.role}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Get in Touch</h2>
          <p className="mt-4 text-gray-600">
            Have questions? We&apos;d love to hear from you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:hello@LawXP.in"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Email Us
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
