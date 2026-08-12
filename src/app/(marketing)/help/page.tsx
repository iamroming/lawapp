"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Book,
  MessageCircle,
  Send,
  Search,
} from "lucide-react";

type FaqItem = { q: string; a: string };
type FaqCategory = { category: string; items: FaqItem[] };

const faqData: FaqCategory[] = [
  {
    category: "General",
    items: [
      {
        q: "What is CaseFiles and who is it for?",
        a: "CaseFiles is a practice management platform built specifically for Indian lawyers and law firms. It helps you manage cases, clients, billing, court dates, documents, and AI-powered legal research — all in one place. Whether you're a solo practitioner or a multi-partner firm, CaseFiles adapts to your workflow.",
      },
      {
        q: "How does the free trial work?",
        a: "Every paid plan includes a 14-day free trial with full access to all features in your chosen tier. No credit card is required to start. At the end of the trial, you can subscribe to continue or your account will be downgraded to a read-only state — your data is never deleted.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm, etc.), net banking, and NEFT/RTGS transfers — all processed securely through Razorpay. All invoices include GST for ITR compliance. Annual billing saves you approximately 17%.",
      },
    ],
  },
  {
    category: "Account & Billing",
    items: [
      {
        q: "Can I switch plans at any time?",
        a: "Yes. You can upgrade or downgrade from Settings > Billing > Subscription. Upgrades take effect immediately with prorated billing for the remainder of the cycle. Downgrades take effect at the end of your current billing period. No data is lost when switching plans.",
      },
      {
        q: "What happens to my data if I cancel?",
        a: "If you cancel, your account remains active until the end of your current billing period. After that, your data is retained in a read-only state for 90 days. During this window you can export all your data. After 90 days, data is permanently deleted from our servers. We recommend exporting before cancelling.",
      },
      {
        q: "How do I invite team members to my firm?",
        a: "Go to Settings > Team Members and click 'Invite'. Enter their email address and assign a role: Admin (full access), Lawyer (cases + billing), or Staff (limited access). They'll receive an email invitation with a link to join your firm on CaseFiles. You can manage roles and remove members at any time.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a full refund within 7 days of any new purchase if you're not satisfied — just email us at support@casefiles.in. After 7 days, you can cancel your subscription anytime and retain access until the end of your current billing period. No partial refunds are issued mid-cycle.",
      },
    ],
  },
  {
    category: "Cases & Clients",
    items: [
      {
        q: "Can I import data from other software?",
        a: "Yes. Go to Settings > Import Data and download our CSV template. You can bulk-import cases, clients, contacts, and court dates. Our system automatically detects and deduplicates entries. For larger migrations from specific tools, our support team can assist with a one-time data transfer.",
      },
      {
        q: "Can clients access the portal?",
        a: "Professional plans and above include a Client Portal. You can invite clients to view their case status, upcoming hearing dates, shared documents, and invoices. Clients have read-only access by default — you control exactly what they can see. The portal works on mobile browsers with no app download required.",
      },
      {
        q: "Can multiple lawyers in a firm use it?",
        a: "Absolutely. The Professional plan includes 3 users, Firm includes 10, and Enterprise includes up to 50. Each lawyer gets their own login with role-based permissions. You can assign cases to specific lawyers, set visibility rules, and collaborate on shared matters.",
      },
    ],
  },
  {
    category: "Documents & Storage",
    items: [
      {
        q: "What are the storage limits?",
        a: "Solo plans include 1 GB, Professional includes 3 GB, Firm includes 7 GB, and Enterprise includes 20 GB. You can purchase additional storage add-ons (50 GB bundles at ₹200/month) if needed. You'll receive email alerts when you approach 80% of your limit.",
      },
      {
        q: "What file types can I upload?",
        a: "CaseFiles supports all common legal document formats: PDF, DOCX, DOC, XLSX, JPG, PNG, and TIFF. You can upload pleadings, agreements, evidence documents, court orders, and more. All files are encrypted at rest (AES-256) and searchable via our document management system.",
      },
    ],
  },
  {
    category: "Court Integration",
    items: [
      {
        q: "How does court integration work?",
        a: "CaseFiles integrates with e-filing portals across multiple Indian courts. You can track case status, view cause lists, and receive automatic updates on hearing dates and orders. We currently support High Courts in Mumbai, Delhi, Bangalore, Chennai, and Kolkata, with District Courts being added on a rolling basis.",
      },
      {
        q: "How does the court calendar sync work?",
        a: "Go to Settings > Calendar Sync to connect your Google, Outlook, or Apple calendar. Once connected, all court dates sync bidirectionally — any changes made in CaseFiles appear in your personal calendar and vice versa. You can configure reminder timing (1 day, 3 days, 1 week before) in the same section.",
      },
    ],
  },
  {
    category: "AI Features",
    items: [
      {
        q: "How does the AI legal assistant work?",
        a: "Our AI is trained on Indian legal databases including the IPC, CrPC, CPC, Indian Evidence Act, and landmark Supreme Court and High Court judgments. It helps with legal research, contract drafting, case summaries, and answering legal queries. The Professional plan includes 200 AI queries/month; Firm plans offer unlimited queries.",
      },
      {
        q: "Is the AI advice legally binding?",
        a: "No. The AI legal assistant is a research and drafting tool — it is not a substitute for professional legal advice. All outputs should be reviewed and verified by a qualified advocate before use in any legal proceeding. CaseFiles clearly labels all AI-generated content as such. You remain fully responsible for the advice you give your clients.",
      },
      {
        q: "What languages does the AI support?",
        a: "The CaseFiles interface is available in English and Hindi. Our AI legal assistant supports English, Hindi, and Marathi for document drafting and legal research queries. We are actively adding support for Tamil, Telugu, and Bengali.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    items: [
      {
        q: "How is my data protected?",
        a: "We use AES-256 encryption for data at rest, TLS 1.3 for data in transit, and SOC 2 Type II compliant infrastructure hosted exclusively in India (AWS Mumbai region). We are fully compliant with the Digital Personal Data Protection Act (DPDP Act) 2023. Your data is never shared with third parties or used for advertising.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. Go to Settings > Data Export to download all your cases, clients, documents, invoices, and billing data in CSV and PDF formats. Exports are generated within 24 hours and you'll receive a download link via email. This ensures full portability and compliance with data protection regulations.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        q: "Is there a mobile app?",
        a: "CaseFiles is fully responsive and works great on mobile browsers — no app download needed. The entire dashboard, case management, and client portal are optimized for phones and tablets. We are also developing dedicated iOS and Android apps for an enhanced native experience.",
      },
      {
        q: "What if I need support?",
        a: "Solo plan users get email support (response within 24 hours). Professional users get priority email support. Firm and Enterprise users have access to priority support via email, live chat, and phone (Mon–Sat, 9 AM – 7 PM IST). Enterprise customers also get a dedicated account manager for onboarding and ongoing assistance.",
      },
    ],
  },
];

const quickLinks = [
  {
    icon: Book,
    title: "Documentation",
    description: "Step-by-step guides for every feature",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team (Mon-Sat, 9AM-7PM)",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "support@CaseFiles.in — response within 24 hours",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const allCategories = ["All", ...faqData.map((c) => c.category)];

  const filteredFaqs = faqData
    .filter((c) => activeCategory === "All" || c.category === activeCategory)
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((c) => c.items.length > 0);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Find answers to common questions about CaseFiles. Can&apos;t find what
            you need? Reach out to our support team.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <div
                  key={link.title}
                  className="rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
                >
                  <Icon className="mx-auto h-8 w-8 text-indigo-600" />
                  <h3 className="mt-3 font-semibold text-gray-900">
                    {link.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {link.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="mt-8 space-y-8">
            {filteredFaqs.map((category) => (
              <div key={category.category}>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((faq) => {
                    const faqKey = `${category.category}-${faq.q}`;
                    const isOpen = openFaq === faqKey;
                    return (
                      <div
                        key={faqKey}
                        className="rounded-xl border border-gray-200 overflow-hidden bg-white"
                      >
                        <button
                          className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            setOpenFaq(isOpen ? null : faqKey)
                          }
                        >
                          {faq.q}
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="mt-12 text-center text-gray-500">
              <Search className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 text-sm">
                No results found. Try a different search term or browse by
                category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Still have questions?
          </h2>
          <p className="mt-4 text-gray-600">
            Our support team is available Mon–Sat, 9 AM – 7 PM IST. We
            typically respond within 24 hours.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:support@casefiles.in"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
