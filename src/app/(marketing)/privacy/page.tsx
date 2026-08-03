import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Last updated: January 1, 2025
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
              <p className="mt-3">
                LawXP (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our legal practice management platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Information We Collect</h2>
              <p className="mt-3">
                We collect information you provide directly: account details (name, email, phone), case data, client information, documents you upload, billing information, and communications with us.
              </p>
              <p className="mt-3">
                We automatically collect: device information, browser type, IP address, usage data (pages visited, features used, time spent), and cookies to improve your experience.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. How We Use Your Information</h2>
              <p className="mt-3">
                We use your information to: provide and maintain the Service, process transactions, send service-related communications, respond to support requests, improve the Service, comply with legal obligations, and protect against fraud or unauthorized access.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Data Storage and Security</h2>
              <p className="mt-3">
                Your data is stored on secure servers located in India. We use AES-256 encryption at rest and TLS 1.3 encryption in transit. We implement SOC 2 compliant security practices, regular security audits, and access controls to protect your information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Data Sharing</h2>
              <p className="mt-3">
                We do not sell your personal information. We may share data with: service providers who assist in operating the Service (under strict confidentiality), legal authorities when required by Indian law, and in connection with a merger or acquisition (with prior notice).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Your Rights</h2>
              <p className="mt-3">
                Under Indian data protection laws, you have the right to: access your personal data, correct inaccurate data, request deletion of your data, object to processing, data portability, and withdraw consent at any time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Client Data Responsibility</h2>
              <p className="mt-3">
                As a legal professional, you are responsible for ensuring you have proper consent from your clients before uploading their data to LawXP. We act as a data processor for client information you store in the Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Cookies</h2>
              <p className="mt-3">
                We use essential cookies for authentication and session management, analytics cookies to understand usage patterns, and preference cookies to remember your settings. You can manage cookies through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">9. Data Retention</h2>
              <p className="mt-3">
                We retain your data for as long as your account is active. Upon account deletion, we delete your personal data within 30 days, except where retention is required by law. Anonymized, aggregated data may be retained indefinitely.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Children&apos;s Privacy</h2>
              <p className="mt-3">
                The Service is not directed to individuals under 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Changes to This Policy</h2>
              <p className="mt-3">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Contact Us</h2>
              <p className="mt-3">
                For questions about this Privacy Policy or to exercise your data rights, contact our Data Protection Officer at{" "}
                <a href="mailto:privacy@LawXP.in" className="text-indigo-600 hover:underline">
                  privacy@LawXP.in
                </a>{" "}
                or write to: LawXP Privacy Team, Mumbai, Maharashtra, India.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
