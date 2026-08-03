"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Book, MessageCircle, Send } from "lucide-react";

const faqs = [
  {
    q: "How do I create my first case?",
    a: "After signing up, navigate to the Cases section from the sidebar. Click 'New Case' and fill in the case details including client name, court, case number, and next hearing date. Your case will be created and appear on your dashboard.",
  },
  {
    q: "How do I add team members to my account?",
    a: "Go to Settings > Team Members and click 'Invite'. Enter their email address and select their role (Admin, Lawyer, or Staff). They'll receive an email invitation to join your firm on LawXP.",
  },
  {
    q: "Can I import existing case data?",
    a: "Yes! We support CSV import for cases, clients, and contacts. Go to Settings > Import Data and download our template. Fill in your data and upload it. Our system will match and deduplicate automatically.",
  },
  {
    q: "How does the court calendar sync work?",
    a: "Go to Settings > Calendar Sync and connect your Google, Outlook, or Apple calendar. Once connected, all court dates will automatically sync both ways. You can configure reminder timing in the same section.",
  },
  {
    q: "How do I generate an invoice?",
    a: "Go to Billing > New Invoice. Select the client, add line items (hearing fees, consultation charges, etc.), and the system will auto-calculate totals including GST. You can preview and send the invoice directly to the client.",
  },
  {
    q: "Is there a mobile app?",
    a: "LawXP is fully responsive and works great on mobile browsers. We're also developing dedicated iOS and Android apps, which will be available in early 2025.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings > Billing > Subscription and click 'Cancel Plan'. Your plan will remain active until the end of your current billing cycle. You can re-subscribe at any time.",
  },
  {
    q: "Can I use LawXP in Hindi or other regional languages?",
    a: "The LawXP interface is available in English and Hindi. Our AI legal assistant supports English, Hindi, and Marathi for document drafting and legal research queries.",
  },
];

const docs = [
  {
    title: "Getting Started Guide",
    description: "Set up your account, invite your team, and create your first case.",
    href: "#",
  },
  {
    title: "Case Management",
    description: "Learn how to create, organize, and track cases effectively.",
    href: "#",
  },
  {
    title: "Client Portal Setup",
    description: "Enable and configure the client portal for your firm.",
    href: "#",
  },
  {
    title: "Billing & Invoicing",
    description: "Generate invoices, track payments, and manage finances.",
    href: "#",
  },
  {
    title: "Calendar & Reminders",
    description: "Sync court dates and configure hearing reminders.",
    href: "#",
  },
  {
    title: "AI Legal Assistant",
    description: "Get the most out of AI-powered legal research and drafting.",
    href: "#",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! Our support team will get back to you within 24 hours.");
    setFormState({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Find answers to common questions or reach out to our support team.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <Book className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Documentation</h3>
              <p className="mt-1 text-sm text-gray-500">Step-by-step guides for every feature</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <MessageCircle className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Live Chat</h3>
              <p className="mt-1 text-sm text-gray-500">Chat with our support team (Mon-Sat, 9AM-7PM)</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <Mail className="mx-auto h-8 w-8 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Email Support</h3>
              <p className="mt-1 text-sm text-gray-500">support@LawXP.in — response within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
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

      {/* Documentation Links */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Documentation
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Link
                key={doc.title}
                href={doc.href}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{doc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl text-center">
            Contact Support
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe your issue or question..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
