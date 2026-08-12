import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | CaseFiles",
  description:
    "Terms and conditions governing the use of CaseFiles legal practice management platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Terms and Conditions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Last updated: August 9, 2026
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">

            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Introduction and Acceptance</h2>
              <p className="mt-3">
                These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement
                between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and CaseFiles
                (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), a company
                incorporated under the laws of India, governing your access to and use of the CaseFiles
                platform, including all associated websites, APIs, mobile applications, and other services
                (collectively, the &quot;Service&quot;).
              </p>
              <p className="mt-3">
                By accessing or using the Service, you acknowledge that you have read, understood, and
                agree to be bound by these Terms. If you are using the Service on behalf of a law firm or
                other legal entity, you represent and warrant that you have the authority to bind that
                entity to these Terms. If you do not agree to these Terms, you must not access or use
                the Service.
              </p>
              <p className="mt-3">
                These Terms should be read in conjunction with our Privacy Policy, which describes how we
                collect, use, and disclose your information. By using the Service, you also agree to the
                terms of our Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Definitions</h2>
              <div className="mt-3 space-y-2">
                <p><strong>&quot;Advocate-Client Privilege&quot;</strong> means the professional privilege
                  recognized under the Advocates Act, 1961 and the Indian Evidence Act, 1872, whereby
                  communications between an advocate and client are protected from disclosure.</p>
                <p><strong>&quot;Client Data&quot;</strong> means all personal data, case information,
                  documents, communications, and any other content uploaded or created by Users in the
                  course of using the Service, including but not limited to client names, case details,
                  court filings, and confidential legal information.</p>
                <p><strong>&quot;Subscription Plan&quot;</strong> means the selected pricing tier and
                  associated usage limits as described on the CaseFiles pricing page.</p>
                <p><strong>&quot;Third-Party Services&quot;</strong> means third-party applications,
                  integrations, and service providers used in connection with the Service, including
                  Supabase, Cloudinary, and Razorpay.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. Description of Service</h2>
              <p className="mt-3">
                CaseFiles is a cloud-based legal practice management platform designed for lawyers and law
                firms in India. The Service provides case management, client portal, billing and invoicing,
                court date calendar, document management, time tracking, and AI-powered legal research
                assistance features. The Service is intended solely for use by licensed legal professionals
                and their authorized staff.
              </p>
              <p className="mt-3">
                CaseFiles does not provide legal advice, nor does the Service substitute for the
                professional judgment of a licensed advocate. All legal decisions remain the sole
                responsibility of the User.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Eligibility</h2>
              <p className="mt-3">
                The Service is available exclusively to individuals who are at least 18 years of age and
                are licensed legal professionals registered with a State Bar Council under the Advocates
                Act, 1961, or authorized employees of such professionals acting under their supervision.
                By using the Service, you represent and warrant that you meet these eligibility
                requirements and that all information provided during registration is accurate and complete.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Account Registration and Security</h2>
              <p className="mt-3">
                You must create an account to access the Service. During registration, you agree to:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Provide accurate, current, and complete information as prompted by the registration form.</li>
                <li>Maintain and promptly update your account information to keep it accurate and complete.</li>
                <li>Maintain the security and confidentiality of your login credentials and not share your account access with unauthorized persons.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
                <li>Notify CaseFiles immediately at <a href="mailto:security@CaseFiles.in" className="text-indigo-600 hover:underline">security@CaseFiles.in</a> of any unauthorized use of your account or any other breach of security.</li>
              </ul>
              <p className="mt-3">
                CaseFiles shall not be liable for any loss or damage arising from your failure to
                comply with this section. You may be held liable for any losses incurred by CaseFiles or
                any other user of the Service due to someone else&apos;s use of your account.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Subscription, Billing, and Payment</h2>
              <p className="mt-3">
                <strong>6.1 Subscription Plans.</strong> The Service is offered on a subscription basis.
                The features, usage limits, and pricing for each Subscription Plan are described on the
                CaseFiles pricing page. We reserve the right to modify, terminate, or otherwise amend any
                Subscription Plan at any time with thirty (30) days&apos; prior written notice.
              </p>
              <p className="mt-3">
                <strong>6.2 Billing Cycle.</strong> Subscriptions are billed in advance on a monthly or
                annual basis, depending on the billing cycle selected at the time of purchase. All fees
                are quoted in Indian Rupees (INR) and are exclusive of applicable taxes unless stated
                otherwise.
              </p>
              <p className="mt-3">
                <strong>6.3 Payment Processing.</strong> All payments are processed through Razorpay, a
                PCI DSS-compliant payment gateway. By providing payment information, you authorize
                Razorpay to charge your selected payment method on a recurring basis according to your
                billing cycle. You agree to comply with Razorpay&apos;s terms of service and privacy
                policy in addition to these Terms.
              </p>
              <p className="mt-3">
                <strong>6.4 Automatic Renewal.</strong> Subscriptions automatically renew at the end of
                each billing cycle unless cancelled at least seven (7) days before the renewal date.
                You may cancel your subscription at any time through your account settings or by
                contacting us at <a href="mailto:billing@CaseFiles.in" className="text-indigo-600 hover:underline">billing@CaseFiles.in</a>.
              </p>
              <p className="mt-3">
                <strong>6.5 Refund Policy.</strong> All subscription fees are non-refundable except
                where required by applicable law under the Consumer Protection Act, 2019. If you cancel
                your subscription, you will continue to have access to the Service until the end of your
                current billing period. No partial refunds or credits will be issued for unused portions
                of a billing period.
              </p>
              <p className="mt-3">
                <strong>6.6 Late Payment.</strong> If your payment method fails or your account is past
                due, we may suspend or terminate your access to the Service. Late payments may incur
                interest at the rate of one and a half percent (1.5%) per month or the maximum rate
                permitted by law, whichever is lower.
              </p>
              <p className="mt-3">
                <strong>6.7 Taxes.</strong> You are responsible for all applicable taxes, including
                Goods and Services Tax (GST), levied on the Service. CaseFiles will charge GST as
                required under the CGST Act, 2017 and relevant state GST laws.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Client Data Confidentiality and Advocate-Client Privilege</h2>
              <p className="mt-3">
                <strong>7.1 Confidentiality Obligation.</strong> CaseFiles recognizes the sanctity of
                advocate-client privilege under Indian law. We shall treat all Client Data as strictly
                confidential and shall not access, use, disclose, or permit access to any Client Data
                except as expressly necessary to provide, maintain, and improve the Service, or as
                required by applicable law or a valid court order.
              </p>
              <p className="mt-3">
                <strong>7.2 Non-Interference with Privilege.</strong> Nothing in these Terms shall be
                construed as a waiver of advocate-client privilege. CaseFiles acts solely as a technology
                platform and does not have an attorney-client relationship with any of your clients. The
                privilege remains exclusively between you and your clients.
              </p>
              <p className="mt-3">
                <strong>7.3 Access Controls.</strong> We implement role-based access controls, encryption
                at rest (AES-256) and in transit (TLS 1.3), multi-factor authentication, and audit
                logging to protect Client Data against unauthorized access, alteration, or disclosure.
              </p>
              <p className="mt-3">
                <strong>7.4 Breach Notification.</strong> In the event of a data breach affecting Client
                Data, CaseFiles will notify affected Users within seventy-two (72) hours of becoming
                aware of the breach, as required under the Information Technology Act, 2000 and the
                Information Technology (Reasonable Security Practices and Procedures and Sensitive
                Personal Data or Information) Rules, 2011.
              </p>
              <p className="mt-3">
                <strong>7.5 User Responsibility.</strong> You are solely responsible for ensuring that
                you have obtained all necessary consents from your clients before uploading their
                personal data or sensitive personal information to the Service. You represent and warrant
                that your collection and use of client data through the Service complies with all
                applicable data protection laws, including the Information Technology Act, 2000 and
                applicable rules thereunder.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Data Storage and Security</h2>
              <p className="mt-3">
                <strong>8.1 Data Residency.</strong> All Client Data and User Data is stored exclusively
                on secure servers located within the territory of India. We do not transfer, store, or
                process your data outside India, except with your explicit prior written consent and in
                compliance with applicable data localization requirements under the Information Technology
                Act, 2000.
              </p>
              <p className="mt-3">
                <strong>8.2 Security Measures.</strong> We implement industry-standard security
                practices, including but not limited to:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>SOC 2 Type II compliant infrastructure (via Supabase)</li>
                <li>Regular penetration testing and security audits</li>
                <li>Role-based access controls and audit logging</li>
                <li>Automated backup and disaster recovery procedures</li>
              </ul>
              <p className="mt-3">
                <strong>8.3 Data Backup.</strong> We perform daily encrypted backups of all data. Backups
                are retained for thirty (30) days and stored in geographically separate, secure Indian
                data centers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">9. User Conduct and Prohibited Activities</h2>
              <p className="mt-3">You agree not to:</p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Use the Service for any unlawful purpose or in violation of the Advocates Act, 1961, the Indian Penal Code, 1860, or any other applicable Indian law.</li>
                <li>Upload or transmit any content that infringes upon the intellectual property rights of any third party.</li>
                <li>Attempt to gain unauthorized access to any portion of the Service, other accounts, computer systems, or networks connected to the Service.</li>
                <li>Use automated scripts, bots, or crawlers to access or interact with the Service without our express written permission.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service or the data contained therein.</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, or underlying ideas of the Service.</li>
                <li>Use the Service to send unsolicited communications, spam, or phishing attempts.</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity.</li>
                <li>Use the Service in any manner that could damage, disable, overburden, or impair the Service.</li>
                <li>Use the Service to facilitate any form of professional misconduct as defined by the Bar Council of India rules.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Intellectual Property</h2>
              <p className="mt-3">
                <strong>10.1 Company IP.</strong> The Service, including its original content, features,
                functionality, user interface, design, text, graphics, logos, icons, software code, and
                all other elements thereof, is owned by CaseFiles and is protected by Indian copyright
                law (under the Copyright Act, 1957), trademark law, patent law, trade secret law, and
                other intellectual property laws and international treaties.
              </p>
              <p className="mt-3">
                <strong>10.2 Limited License.</strong> Subject to your compliance with these Terms,
                CaseFiles grants you a limited, non-exclusive, non-transferable, revocable license to
                access and use the Service for your internal legal practice management purposes during
                the term of your subscription.
              </p>
              <p className="mt-3">
                <strong>10.3 Your Content.</strong> You retain all ownership rights in any content you
                upload, create, or transmit through the Service. By using the Service, you grant
                CaseFiles a limited, non-exclusive license solely to host, store, transmit, and display
                your content as necessary to provide and maintain the Service. This license terminates
                upon deletion of your account.
              </p>
              <p className="mt-3">
                <strong>10.4 AI-Generated Content.</strong> Any legal research summaries, document
                templates, or other content generated by the AI-powered features of the Service are
                provided for informational purposes only. You are solely responsible for reviewing and
                verifying any AI-generated content before relying upon it. CaseFiles does not claim
                ownership over AI-generated content created specifically for you.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Third-Party Integrations</h2>
              <p className="mt-3">
                <strong>11.1 Overview.</strong> The Service integrates with certain third-party service
                providers to deliver functionality. These include:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li><strong>Supabase:</strong> Provides the underlying database infrastructure, authentication, and real-time subscriptions. Supabase operates SOC 2 Type II compliant infrastructure with data residency in India.</li>
                <li><strong>Cloudinary:</strong> Provides image and document storage, transformation, and delivery services. Document uploads are stored in Cloudinary&apos;s Indian data centers.</li>
                <li><strong>Razorpay:</strong> Provides payment processing services for subscription billing and payments. Razorpay is PCI DSS Level 1 compliant.</li>
              </ul>
              <p className="mt-3">
                <strong>11.2 Third-Party Terms.</strong> Your use of Third-Party Services is subject to
                their respective terms of service and privacy policies. CaseFiles is not responsible for
                the availability, accuracy, or practices of any Third-Party Services. We encourage you to
                review the terms and privacy policies of each Third-Party Service you use.
              </p>
              <p className="mt-3">
                <strong>11.3 Limitation of Responsibility.</strong> While we select Third-Party Service
                providers that meet industry security standards, CaseFiles does not control and is not
                liable for the data handling practices of Third-Party Services. Our liability with
                respect to Third-Party Services is limited to exercising reasonable diligence in selecting
                and monitoring such providers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Limitation of Liability</h2>
              <p className="mt-3">
                <strong>12.1 Disclaimer of Warranties.</strong> THE SERVICE IS PROVIDED &quot;AS
                IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. CaseFiles does not warrant that
                the Service will be uninterrupted, error-free, secure, or free of viruses or other
                harmful components.
              </p>
              <p className="mt-3">
                <strong>12.2 No Legal Advice.</strong> CaseFiles is a technology platform and does not
                provide legal advice. The Service, including any templates, research aids, or AI-generated
                content, is provided for informational and administrative purposes only. You should not
                rely on any content generated by the Service as a substitute for professional legal
                advice.
              </p>
              <p className="mt-3">
                <strong>12.3 Limitation.</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW,
                CaseFiles, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES SHALL
                NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, CLIENT
                RELATIONSHIPS, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service;</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content;</li>
                <li>Errors or omissions in any content on the Service;</li>
                <li>The acts, omissions, or conduct of any third-party service providers.</li>
              </ul>
              <p className="mt-3">
                <strong>12.4 Cap on Liability.</strong> In no event shall CaseFiles&apos;s aggregate
                liability exceed the total amount paid by you to CaseFiles during the twelve (12) months
                immediately preceding the event giving rise to the claim. This limitation applies
                regardless of the theory of liability, whether based on contract, tort, negligence,
                strict liability, or any other legal theory.
              </p>
              <p className="mt-3">
                <strong>12.5 Special Disclaimer for Legal Practice.</strong> CaseFiles shall not be
                liable for any legal malpractice claims, loss of client matters, adverse court
                judgments, missed deadlines, or any professional liability arising from your use of or
                reliance upon the Service. You acknowledge that the Service is an administrative tool
                and that all substantive legal decisions remain your sole responsibility.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">13. Indemnification</h2>
              <p className="mt-3">
                You agree to indemnify, defend, and hold harmless CaseFiles and its officers, directors,
                employees, agents, licensors, and suppliers from and against any and all claims,
                liabilities, damages, losses, costs, or expenses (including reasonable attorneys&apos;
                fees) arising out of or in connection with:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Your use of or access to the Service;</li>
                <li>Your violation of any term of these Terms;</li>
                <li>Your violation of any applicable law, rule, or regulation, including data protection laws;</li>
                <li>Any content you submit, post, or transmit through the Service;</li>
                <li>Your violation of any third-party right, including intellectual property, privacy, or proprietary rights;</li>
                <li>Any claim by a third party arising from your use of the Service.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">14. Termination</h2>
              <p className="mt-3">
                <strong>14.1 Termination by You.</strong> You may terminate your account at any time by
                contacting us at <a href="mailto:support@CaseFiles.in" className="text-indigo-600 hover:underline">support@CaseFiles.in</a> or through your account settings. Upon
                termination, you will lose access to the Service and any data stored therein, subject to
                our data retention obligations.
              </p>
              <p className="mt-3">
                <strong>14.2 Termination by CaseFiles.</strong> We may suspend or terminate your access
                to the Service immediately, without prior notice or liability, for any reason,
                including but not limited to:
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Breach of any provision of these Terms;</li>
                <li>Non-payment of subscription fees;</li>
                <li>Engagement in prohibited activities as described in Section 9;</li>
                <li>Upon request by law enforcement or regulatory authorities;</li>
                <li>Upon request by the Bar Council of India or any State Bar Council;</li>
                <li>Discontinuance of the Service (with at least thirty (30) days&apos; prior notice).</li>
              </ul>
              <p className="mt-3">
                <strong>14.3 Data Export and Deletion.</strong> Upon termination for any reason,
                CaseFiles will provide you with a thirty (30) day period to export your data. After
                this period, all your data will be permanently deleted from our systems, except where
                retention is required by applicable law. We will provide written confirmation of data
                deletion upon your request.
              </p>
              <p className="mt-3">
                <strong>14.4 Survival.</strong> The following sections shall survive termination: Section
                7 (Confidentiality), Section 8 (Data Storage), Section 10 (Intellectual Property),
                Section 12 (Limitation of Liability), Section 13 (Indemnification), Section 16
                (Governing Law), and Section 17 (Dispute Resolution).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">15. Force Majeure</h2>
              <p className="mt-3">
                CaseFiles shall not be liable for any failure or delay in performing its obligations
                under these Terms where such failure or delay results from circumstances beyond our
                reasonable control, including but not limited to: acts of God, natural disasters,
                epidemics, pandemics, war, terrorism, civil unrest, government actions or orders,
                sanctions, embargoes, labor disputes, strikes, power grid failures, internet or
                telecommunications failures, cyberattacks, ransomware, or any other event constituting
                force majeure under the Indian Contract Act, 1872.
              </p>
              <p className="mt-3">
                Upon the occurrence of a force majeure event, CaseFiles shall use commercially
                reasonable efforts to mitigate the impact and resume performance as soon as reasonably
                practicable. If a force majeure event continues for more than ninety (90) consecutive
                days, either party may terminate the affected Subscription Plan without penalty upon
                written notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">16. Governing Law</h2>
              <p className="mt-3">
                These Terms shall be governed by and construed in accordance with the laws of India,
                including but not limited to the Indian Contract Act, 1872, the Information Technology
                Act, 2000, the Consumer Protection Act, 2019, and the Information Technology
                (Reasonable Security Practices and Procedures and Sensitive Personal Data or
                Information) Rules, 2011, without regard to its conflict of law principles.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">17. Dispute Resolution</h2>
              <p className="mt-3">
                <strong>17.1 Negotiation.</strong> In the event of any dispute, controversy, or claim
                arising out of or relating to these Terms or the breach, termination, or validity
                thereof, the parties shall first attempt to resolve the dispute through good-faith
                negotiation within thirty (30) days of written notice of the dispute.
              </p>
              <p className="mt-3">
                <strong>17.2 Mediation.</strong> If the dispute cannot be resolved through negotiation,
                the parties agree to submit the dispute to mediation before attempting any other form of
                resolution. The mediation shall take place in Mumbai, Maharashtra.
              </p>
              <p className="mt-3">
                <strong>17.3 Jurisdiction.</strong> Subject to the foregoing, any dispute that cannot be
                resolved through negotiation or mediation shall be subject to the exclusive jurisdiction
                of the competent courts in Mumbai, Maharashtra, India. Each party irrevocably submits to
                the exclusive jurisdiction of such courts.
              </p>
              <p className="mt-3">
                <strong>17.4 Consumer Rights.</strong> Nothing in this section shall restrict your rights
                as a consumer under the Consumer Protection Act, 2019, including the right to approach a
                consumer dispute redressal forum at the appropriate level.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">18. Amendments to Terms</h2>
              <p className="mt-3">
                CaseFiles reserves the right to modify or amend these Terms at any time at our sole
                discretion. We will notify you of any material changes by posting the updated Terms on
                this page and updating the &quot;Last updated&quot; date. For material changes, we will
                provide additional notice such as email notification at least thirty (30) days before
                the changes take effect. Your continued use of the Service after the effective date of
                any modifications constitutes your acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">19. Severability</h2>
              <p className="mt-3">
                If any provision of these Terms is held to be invalid, illegal, or unenforceable under
                any applicable law, such provision shall be modified to the minimum extent necessary to
                make it valid and enforceable, or if modification is not possible, it shall be severed
                from these Terms. The invalidity or unenforceability of any provision shall not affect
                the validity or enforceability of the remaining provisions, which shall continue in full
                force and effect.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">20. Entire Agreement</h2>
              <p className="mt-3">
                These Terms, together with the Privacy Policy and any additional terms applicable to
                specific features or services of the platform, constitute the entire agreement between
                you and CaseFiles regarding the use of the Service and supersede all prior and
                contemporaneous agreements, understandings, negotiations, and discussions, whether oral
                or written, between the parties relating to the subject matter hereof.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">21. Waiver</h2>
              <p className="mt-3">
                No waiver of any provision of these Terms shall be deemed a further or continuing waiver
                of such provision or any other provision. CaseFiles&apos;s failure to assert any right
                or provision under these Terms shall not constitute a waiver of such right or provision.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">22. Assignment</h2>
              <p className="mt-3">
                You may not assign or transfer these Terms or any of your rights or obligations
                hereunder without the prior written consent of CaseFiles. CaseFiles may assign these
                Terms, in whole or in part, without restriction. Any attempted assignment in violation
                of this provision shall be null and void.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">23. Contact Information</h2>
              <p className="mt-3">
                If you have any questions, concerns, or complaints about these Terms, please contact us:
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>CaseFiles</strong></p>
                <p>C/o CaseFiles Technologies Private Limited</p>
                <p>Maharashtra, India</p>
                <p>
                  Email:{" "}
                  <a href="mailto:legal@CaseFiles.in" className="text-indigo-600 hover:underline">
                    legal@CaseFiles.in
                  </a>
                </p>
                <p>
                  Support:{" "}
                  <a href="mailto:support@CaseFiles.in" className="text-indigo-600 hover:underline">
                    support@CaseFiles.in
                  </a>
                </p>
                <p>
                  Billing:{" "}
                  <a href="mailto:billing@CaseFiles.in" className="text-indigo-600 hover:underline">
                    billing@CaseFiles.in
                  </a>
                </p>
                <p>
                  Security:{" "}
                  <a href="mailto:security@CaseFiles.in" className="text-indigo-600 hover:underline">
                    security@CaseFiles.in
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
