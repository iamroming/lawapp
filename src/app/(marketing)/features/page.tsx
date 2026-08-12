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
  Shield,
  Search,
  Bell,
  FileText,
  BarChart3,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Case Management",
    description:
      "Track every case from filing to resolution with a powerful, intuitive dashboard. Organize by court, client, status, or date. Never lose track of a hearing or deadline again.",
    highlights: [
      "Custom case statuses and workflows",
      "Track multiple courts and jurisdictions",
      "Link related cases together",
      "Detailed case timeline and activity log",
      "Advanced search and filtering",
    ],
    useCases: [
      "Track a consumer complaint from filing through multiple hearings to final order",
      "Manage bail applications with deadline tracking",
      "Organize property dispute cases across different courts",
    ],
    placeholder: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    icon: Users,
    title: "Client Portal",
    description:
      "Give your clients a secure, branded portal to stay updated on their cases. Clients can view progress, upload documents, and message your team — reducing back-and-forth calls.",
    highlights: [
      "Secure login with OTP verification",
      "Real-time case status updates",
      "Document upload and sharing",
      "Built-in messaging system",
      "Invoice viewing and payment",
    ],
    useCases: [
      "Allow corporate clients to track multiple ongoing matters",
      "Enable individual clients to upload evidence documents",
      "Share court orders and judgments securely with clients",
    ],
    placeholder: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    icon: Receipt,
    title: "Billing & Invoicing",
    description:
      "Generate professional invoices, track retainers, and manage your firm's finances. Supports GST-compliant invoicing, payment tracking, and financial reporting.",
    highlights: [
      "GST-compliant invoice generation",
      "Retainer and advance fee tracking",
      "Payment reminders and follow-ups",
      "Expense tracking per case",
      "Financial reports and analytics",
    ],
    useCases: [
      "Generate monthly retainer invoices for corporate clients",
      "Track per-hearing fees and expenses",
      "Generate GST reports for tax filing",
    ],
    placeholder: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    icon: Calendar,
    title: "Court Calendar",
    description:
      "Sync court dates with Google Calendar, Outlook, or Apple Calendar. Get automatic reminders before every hearing so you never miss a court appearance.",
    highlights: [
      "Two-way calendar sync",
      "Configurable reminders (1 day, 3 days, 1 week)",
      "Court holiday calendar for all Indian courts",
      "Multi-lawyer scheduling",
      "Conflict detection for overlapping dates",
    ],
    useCases: [
      "Sync all court dates to your personal Google Calendar",
      "Get morning alerts for the day's hearings",
      "Detect scheduling conflicts when multiple lawyers share cases",
    ],
    placeholder: "bg-gradient-to-br from-purple-500 to-violet-600",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Store, organize, and retrieve case documents instantly. Support for all common formats with version control, tagging, and secure access for your entire team.",
    highlights: [
      "Support for PDF, DOCX, images, and more",
      "Version control and document history",
      "Tag-based organization",
      "Full-text search across all documents",
      "Secure access with role-based permissions",
    ],
    useCases: [
      "Store petition drafts with version history",
      "Organize evidence documents by type and case",
      "Quickly find a specific clause in stored contracts",
    ],
    placeholder: "bg-gradient-to-br from-rose-500 to-pink-600",
  },
  {
    icon: Bot,
    title: "AI Legal Assistant",
    description:
      "Leverage AI trained on Indian legal databases to draft contracts, summarize case law, and get research assistance. Save hours on routine legal research tasks.",
    highlights: [
      "IPC, CrPC, CPC, and Constitution database",
      "Contract and deed drafting assistance",
      "Case law summarization",
      "Legal opinion generation",
      "Multilingual support (English, Hindi, Marathi)",
    ],
    useCases: [
      "Draft a rental agreement with state-specific clauses",
      "Summarize a 50-page Supreme Court judgment",
      "Find relevant precedents for a bail application",
    ],
    placeholder: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Powerful Features for
            <br />
            <span className="text-indigo-600">Modern Legal Practices</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            CaseFiles combines all the tools you need to manage your practice efficiently —
            from case intake to final billing.
          </p>
        </div>
      </section>

      {/* Feature Details */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isReversed = index % 2 === 1;
              return (
                <div
                  key={feature.title}
                  className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
                    isReversed ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Text */}
                  <div className="flex-1">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      {feature.title}
                    </h2>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-2">
                      {feature.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Placeholder image */}
                  <div className="flex-1">
                    <div
                      className={`${feature.placeholder} aspect-video rounded-2xl shadow-lg flex items-center justify-center`}
                    >
                      <Icon className="h-20 w-20 text-white/30" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See CaseFiles in Action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Experience all features with a 14-day free trial. No credit card required.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
