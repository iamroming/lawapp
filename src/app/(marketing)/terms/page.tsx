import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Terms of Service
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
              <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              <p className="mt-3">
                By accessing or using LawXP (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These Terms apply to all visitors, users, and others who access the Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Description of Service</h2>
              <p className="mt-3">
                LawXP is a cloud-based legal practice management platform designed for lawyers and law firms in India. The Service includes case management, client portal, billing, court calendar, document management, and AI-powered legal assistant features.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. User Accounts</h2>
              <p className="mt-3">
                You must provide accurate and complete information when creating an account. You are responsible for safeguarding your password and for all activities under your account. You must notify us immediately of any unauthorized use.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Subscription and Payment</h2>
              <p className="mt-3">
                Free plans are subject to usage limits as described on our pricing page. Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by applicable law. We reserve the right to change pricing with 30 days&apos; notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Data Ownership</h2>
              <p className="mt-3">
                You retain full ownership of all data you upload to LawXP. We will not access, use, or share your data except as necessary to provide the Service or as required by law. Upon account deletion, we will delete your data within 30 days.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Acceptable Use</h2>
              <p className="mt-3">
                You agree not to use the Service for any unlawful purpose, to violate any applicable Indian laws, to transmit harmful or malicious content, to attempt unauthorized access to other accounts or systems, or to interfere with the Service&apos;s operation.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Intellectual Property</h2>
              <p className="mt-3">
                The Service and its original content, features, and functionality are owned by LawXP and are protected by Indian copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Limitation of Liability</h2>
              <p className="mt-3">
                To the maximum extent permitted by law, LawXP shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">9. Indemnification</h2>
              <p className="mt-3">
                You agree to indemnify and hold harmless LawXP and its officers, directors, employees, and agents from any claims, losses, damages, liabilities, costs, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Termination</h2>
              <p className="mt-3">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service ceases immediately.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Governing Law</h2>
              <p className="mt-3">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Changes to Terms</h2>
              <p className="mt-3">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">13. Contact Us</h2>
              <p className="mt-3">
                If you have questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@LawXP.in" className="text-indigo-600 hover:underline">
                  legal@LawXP.in
                </a>{" "}
                or write to us at LawXP Legal Team, Mumbai, Maharashtra, India.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
