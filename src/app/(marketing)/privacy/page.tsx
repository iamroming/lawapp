export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Last updated: August 2026
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">

            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
              <p className="mt-3">
                CaseFiles (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated from Mumbai, Maharashtra, India, is committed to protecting your privacy and personal data. This Privacy Policy describes how we collect, use, store, disclose, and safeguard your information when you use our legal practice management platform (the &quot;Service&quot;).
              </p>
              <p className="mt-3">
                This policy is formulated in compliance with the Information Technology Act, 2000 (&quot;IT Act&quot;), the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;), and other applicable Indian data protection laws. By using the Service, you consent to the practices described herein.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Information We Collect</h2>
              <p className="mt-3">
                We collect the following categories of data to provide and improve the Service:
              </p>

              <h3 className="mt-4 text-base font-semibold text-gray-900">2.1 Personal Information</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Full name, email address, phone number</li>
                <li>Professional details: Bar Council enrollment number, chamber address, practice areas</li>
                <li>Account credentials (hashed passwords, two-factor authentication data)</li>
                <li>Profile photograph (if uploaded)</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">2.2 Financial Information</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Billing address and GST details</li>
                <li>Payment transaction records (processed via Razorpay; we do not store card numbers or CVV)</li>
                <li>Invoice and fee note records</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">2.3 Case Data</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Case details: case numbers, party names, court names, judge names, hearing dates</li>
                <li>Case notes, internal memos, and legal research</li>
                <li>Client communications and correspondence</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">2.4 Documents and Files</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Uploaded documents: pleadings, contracts, evidence, court orders</li>
                <li>Scanned images and OCR-processed text</li>
                <li>Documents generated through the AI Legal Assistant</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">2.5 Automatically Collected Information</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Device type, operating system, browser type and version</li>
                <li>IP address, approximate geolocation (city-level)</li>
                <li>Usage data: pages visited, features used, session duration, click patterns</li>
                <li>Log data: error reports, performance metrics</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. Advocate-Client Privilege and Confidentiality</h2>
              <p className="mt-3">
                We recognize the sanctity of advocate-client privilege under the Indian Evidence Act, 1872 (Section 126) and the Advocates Act, 1961. Your case data, client communications, and legal documents are treated as strictly confidential.
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>We do not access, review, or use your case data or client communications for any purpose other than providing the Service.</li>
                <li>Our employees and contractors are bound by strict confidentiality obligations and do not have access to your data unless necessary for technical support, and only with your explicit authorization.</li>
                <li>We will not disclose case data to any third party except as required by a valid court order, legal process, or as expressly directed by you.</li>
                <li>AI-assisted features process data algorithmically; no human reviews the content of your documents or case files unless you explicitly request support assistance.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Legal Basis for Processing</h2>
              <p className="mt-3">
                Under the IT Act and SPDI Rules, we process your data based on:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li><strong>Consent:</strong> You provide explicit consent when creating an account and uploading data.</li>
                <li><strong>Contractual necessity:</strong> Processing is necessary to perform our obligations under the Terms of Service.</li>
                <li><strong>Legal obligation:</strong> Processing is required to comply with applicable Indian laws, court orders, or regulatory requirements.</li>
                <li><strong>Legitimate interest:</strong> Processing is necessary for fraud prevention, security, and service improvement, balanced against your privacy rights.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. How We Use Your Information</h2>
              <p className="mt-3">We use the collected data to:</p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process subscription payments and generate invoices</li>
                <li>Send service-related communications (account alerts, billing notices, security notifications)</li>
                <li>Respond to support requests and resolve technical issues</li>
                <li>Generate anonymized, aggregated analytics to improve the Service</li>
                <li>Power AI-assisted features (legal draft generation, case analysis) based solely on data you provide</li>
                <li>Comply with legal obligations and respond to lawful requests from Indian authorities</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Data Storage and Security</h2>
              <p className="mt-3">
                In compliance with Rule 8 of the SPDI Rules (Reasonable Security Practices), we implement the following security measures:
              </p>

              <h3 className="mt-4 text-base font-semibold text-gray-900">6.1 Infrastructure</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>All primary data is stored on Supabase servers located in India (AWS Mumbai region, ap-south-1).</li>
                <li>Documents and media files are stored on Cloudinary with India-based CDN nodes.</li>
                <li>We do not transfer your data outside India for storage purposes (see Section 11 on Cross-Border Transfer).</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">6.2 Encryption</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Data at rest: AES-256 encryption</li>
                <li>Data in transit: TLS 1.3 (HTTPS) encryption for all communications</li>
                <li>Database-level encryption for sensitive fields</li>
                <li>End-to-end encryption for document uploads</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">6.3 Access Controls</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Role-based access control (RBAC) within the platform</li>
                <li>Multi-factor authentication (MFA) support</li>
                <li>Session management with automatic timeout</li>
                <li>Audit logging of all data access and modifications</li>
                <li>Annual third-party security audits and penetration testing</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Data Sharing and Disclosure</h2>
              <p className="mt-3">
                We do not sell, rent, or trade your personal information. We share data only in the following circumstances:
              </p>

              <h3 className="mt-4 text-base font-semibold text-gray-900">7.1 Service Providers</h3>
              <p className="mt-3">
                We engage trusted third-party processors who operate under strict Data Processing Agreements (DPAs) with confidentiality and security obligations:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li><strong>Supabase:</strong> Database hosting, authentication, and real-time subscriptions</li>
                <li><strong>Razorpay:</strong> Payment processing (Razorpay is PCI DSS Level 1 compliant; we do not store payment card data)</li>
                <li><strong>Cloudinary:</strong> Document and media file storage, image optimization, and delivery</li>
                <li><strong>OpenAI:</strong> AI-powered features (legal draft generation, case analysis). Data sent to OpenAI is processed under API agreements that prohibit training on your data. No case data is used to train AI models.</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">7.2 Legal Requirements</h3>
              <p className="mt-3">
                We may disclose your data if required by:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>A valid court order or subpoena issued under Indian law</li>
                <li>A direction from a competent government authority under the IT Act</li>
                <li>A request from law enforcement agencies for investigation of cyber incidents under Section 69 of the IT Act</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">7.3 Business Transfers</h3>
              <p className="mt-3">
                In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will provide 30 days&apos; prior notice and ensure the successor entity honors this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Data Retention and Deletion</h2>
              <p className="mt-3">
                We retain your data in accordance with the following policy:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li><strong>Active accounts:</strong> Data is retained for as long as your account is active and the Service is being used.</li>
                <li><strong>Account deletion:</strong> Upon account deletion request, all personal data, case data, and documents are permanently deleted from our active systems within 30 days. Backup copies are purged within 90 days.</li>
                <li><strong>Legal retention:</strong> Where retention is required by applicable Indian law (e.g., under the Companies Act, 2013 or Income Tax Act, 1961), we retain the minimum necessary data for the legally mandated period.</li>
                <li><strong>Anonymized data:</strong> Aggregated, anonymized data that cannot identify you may be retained indefinitely for analytics and service improvement.</li>
                <li><strong>Financial records:</strong> Transaction records are retained for 7 years as required under Indian tax laws.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">9. Your Rights Under Indian Law</h2>
              <p className="mt-3">
                Under the IT Act and SPDI Rules, you have the following rights:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li><strong>Right to Access (Rule 5):</strong> You may request a copy of all personal data we hold about you. We will respond within 30 days.</li>
                <li><strong>Right to Correction:</strong> You may request correction of inaccurate or incomplete personal data.</li>
                <li><strong>Right to Withdraw Consent:</strong> You may withdraw consent for data processing at any time. Where processing is based solely on consent, we will cease processing your data upon withdrawal.</li>
                <li><strong>Right to Grievance Redressal:</strong> You may file a complaint with our Grievance Officer if you are dissatisfied with our data handling practices (see Section 14).</li>
                <li><strong>Right to Data Portability:</strong> You may request your data in a commonly used, machine-readable format (CSV/JSON) for transfer to another service provider.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@casefiles.in" className="text-indigo-600 hover:underline">
                  privacy@casefiles.in
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Cookies Policy</h2>
              <p className="mt-3">
                We use cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device.
              </p>

              <h3 className="mt-4 text-base font-semibold text-gray-900">10.1 Types of Cookies</h3>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security. These cannot be disabled.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences (language, theme, layout settings) to provide a personalized experience.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns (pages visited, features used, errors encountered) so we can improve the Service. We use privacy-respecting analytics that do not track individual users across websites.</li>
              </ul>

              <h3 className="mt-4 text-base font-semibold text-gray-900">10.2 Managing Cookies</h3>
              <p className="mt-3">
                You can control cookies through your browser settings. Disabling essential cookies may impair the functionality of the Service. Disabling functional or analytics cookies will not affect core functionality.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Cross-Border Data Transfer</h2>
              <p className="mt-3">
                Our primary data infrastructure is located in India. However, certain service providers may process limited data in jurisdictions outside India:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li><strong>OpenAI API:</strong> AI processing requests may be routed through OpenAI&apos;s servers located in the United States. This data is processed under API agreements that strictly prohibit the use of your data for model training.</li>
                <li><strong>Email delivery:</strong> Transactional and service emails may be routed through servers located outside India.</li>
              </ul>
              <p className="mt-3">
                Where data transfer outside India occurs, we ensure adequate protection through contractual safeguards, encryption, and compliance with applicable data transfer provisions under Indian law. We do not transfer Sensitive Personal Data or Information outside India except where necessary for performance of a contract and with appropriate security measures in place.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Children&apos;s Privacy</h2>
              <p className="mt-3">
                The Service is designed for legal professionals and is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected data from a child under 18, we will take immediate steps to delete such information. If you believe a child has provided us with personal data, please contact us immediately at{" "}
                <a href="mailto:privacy@casefiles.in" className="text-indigo-600 hover:underline">
                  privacy@casefiles.in
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">13. Data Breach Notification</h2>
              <p className="mt-3">
                In the event of a data breach involving Sensitive Personal Data or Information, we will:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>Notify affected users within 72 hours of becoming aware of the breach, in compliance with Rule 6 of the SPDI Rules.</li>
                <li>Notify the Indian Computer Emergency Response Team (CERT-In) as required under the IT Act and the Information Technology (Indian Computer Emergency Response Team and Manner of Performing Functions and Duties) Rules, 2013.</li>
                <li>Provide details of the breach, the data affected, and the remedial measures taken.</li>
                <li>Take immediate steps to contain the breach, secure affected systems, and prevent recurrence.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">14. Grievance Officer</h2>
              <p className="mt-3">
                In accordance with the IT Act and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the name and contact details of our Grievance Officer are provided below. You may contact the Grievance Officer for any complaints regarding the processing of your personal data, or for exercising any of your rights under this policy:
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-gray-200">
                <p className="font-semibold text-gray-900">Grievance Officer</p>
                <p className="mt-1">CaseFiles</p>
                <p className="mt-1">Mumbai, Maharashtra, India</p>
                <p className="mt-1">
                  Email:{" "}
                  <a href="mailto:privacy@casefiles.in" className="text-indigo-600 hover:underline">
                    privacy@casefiles.in
                  </a>
                </p>
              </div>
              <p className="mt-3">
                The Grievance Officer will acknowledge your complaint within 24 hours and endeavor to resolve it within 30 days from the date of receipt.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">15. Third-Party Links</h2>
              <p className="mt-3">
                The Service may contain links to third-party websites or services (e.g., court websites, legal databases). We are not responsible for the privacy practices of such third parties. We encourage you to review the privacy policies of any third-party services you access through the Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">16. Changes to This Policy</h2>
              <p className="mt-3">
                We reserve the right to modify this Privacy Policy at any time. Material changes will be notified to you via email or a prominent notice on the Service at least 30 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised policy. The &quot;Last updated&quot; date at the top of this page indicates when this policy was last revised.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">17. Contact Us</h2>
              <p className="mt-3">
                For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-gray-200">
                <p className="font-semibold text-gray-900">CaseFiles Privacy Team</p>
                <p className="mt-1">Mumbai, Maharashtra, India</p>
                <p className="mt-1">
                  Email:{" "}
                  <a href="mailto:privacy@casefiles.in" className="text-indigo-600 hover:underline">
                    privacy@casefiles.in
                  </a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
