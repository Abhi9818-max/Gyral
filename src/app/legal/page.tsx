"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type TabId = "terms" | "privacy" | "refund" | "contact";

function LegalContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("terms");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabId;
    if (tabParam && ["terms", "privacy", "refund", "contact"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    { id: "terms", label: "Terms of Service", icon: "gavel" },
    { id: "privacy", label: "Privacy Policy", icon: "lock" },
    { id: "refund", label: "Refund Policy", icon: "currency_exchange" },
    { id: "contact", label: "Contact Us", icon: "mail" },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <div className="grain-overlay"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl flex justify-between items-center px-margin-desktop h-16 border-b border-surface-container-highest">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
          <span className="font-headline-lg text-[22px] tracking-tight text-primary font-medium">GYRAL LEGAL</span>
        </Link>
        <div>
          <Link
            className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all duration-300 active:scale-95 uppercase font-semibold"
            href="/login"
          >
            Enter Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-24 relative z-10">
        <header className="mb-12 border-b border-surface-container-highest pb-8">
          <h1 className="font-display-lg text-display-lg text-white mb-4 uppercase">
            Legal &amp; <span className="italic text-primary font-light">Compliance</span>
          </h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl">
            Transparency is a core principle. Here you will find the complete treaties governing your data security,
            service usage rights, refund guarantees, and secure transmissions.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-4 flex flex-col gap-2 bg-surface-container-lowest p-4 marble-border rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-4 px-6 py-4 rounded-md text-left transition-all duration-300 font-label-md text-label-md uppercase font-semibold ${
                  activeTab === tab.id
                    ? "bg-primary text-on-primary shadow-lg gold-glow"
                    : "text-on-surface-variant hover:text-white hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-8 marble-border p-8 md:p-12 bg-surface-container-low rounded-lg min-h-[500px]">
            {activeTab === "terms" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="font-headline-md text-headline-md text-white mb-2 uppercase font-semibold">Terms of Service</h2>
                  <p className="text-sm text-primary uppercase font-semibold">Effective June 2026</p>
                </div>
                <div className="w-12 h-0.5 bg-primary"></div>

                <div className="space-y-6 text-on-surface-variant leading-relaxed">
                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">1. Agreement to Terms</h3>
                    <p>
                      By accessing and using Gyral (&quot;the Platform&quot;), you agree to be bound by these Terms of
                      Service. If you do not agree, you must discontinue use of the Platform immediately.
                    </p>
                    <p className="mt-2">
                      Gyral is a personal cognitive architecture and habit formation system. You must be at least 16
                      years old to use this service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">2. Acceptable Use</h3>
                    <p>You agree to use Gyral solely for lawful personal development purposes. You shall not:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Platform.</li>
                      <li>Use automated systems to scrape or extract data from the Platform.</li>
                      <li>Impersonate another person or misrepresent your identity.</li>
                      <li>Upload malicious code, viruses, or any harmful content.</li>
                      <li>Use the Platform for any commercial resale or redistribution.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">3. Service Availability</h3>
                    <p>
                      Gyral is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to
                      modify, suspend, or discontinue any aspect of the Platform at any time without prior notice. We
                      do not guarantee uninterrupted, secure, or error-free operation of the service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">4. Intellectual Property</h3>
                    <p>
                      All content, design, code, and intellectual property within Gyral remain the exclusive property of
                      the Gyral team. Your personal data and user-generated content remain yours. By using the Platform,
                      you grant us a limited license to process your data solely to provide the service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">5. Limitation of Liability</h3>
                    <p>
                      Gyral shall not be liable for any indirect, incidental, special, consequential, or punitive
                      damages arising from your use of the Platform. Our total liability shall not exceed the amount
                      paid by you to Gyral in the twelve months preceding the claim.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="font-headline-md text-headline-md text-white mb-2 uppercase font-semibold">Privacy Archive</h2>
                  <p className="text-sm text-primary uppercase font-semibold">Effective June 2026</p>
                </div>
                <div className="w-12 h-0.5 bg-primary"></div>

                <div className="space-y-6 text-on-surface-variant leading-relaxed">
                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">1. Information We Collect</h3>
                    <p>We collect the minimum information necessary to provide our services:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Account information: email address, display name, and profile photo.</li>
                      <li>Usage data: tasks, habits, goals, and progress you choose to track.</li>
                      <li>Device data: browser type, OS version, and screen resolution for optimization.</li>
                      <li>Payment data: processed securely through Razorpay and PayPal — we never store card details.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">2. How We Use Your Data</h3>
                    <p>
                      Your data is used exclusively to power your personal Gyral experience. We do not sell, rent, or
                      trade your personal information to third parties. Data is used for:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Providing and personalizing the Platform experience.</li>
                      <li>Generating AI-powered insights via Gemini (processed without storing prompts).</li>
                      <li>Sending critical account notifications (opt-in only).</li>
                      <li>Improving Platform performance and reliability.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">3. Data Security</h3>
                    <p>
                      We employ industry-standard security measures including TLS encryption in transit, encrypted
                      storage at rest via Supabase, and strict access controls. Your authentication is handled by
                      Supabase Auth with secure session management.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">4. Data Deletion</h3>
                    <p>
                      You may request complete deletion of your account and all associated data at any time by contacting
                      us at the email listed in the Contact section. We will process deletion requests within 30 business
                      days.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "refund" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="font-headline-md text-headline-md text-white mb-2 uppercase font-semibold">Refund Policy</h2>
                  <p className="text-sm text-primary uppercase font-semibold">Effective June 2026</p>
                </div>
                <div className="w-12 h-0.5 bg-primary"></div>

                <div className="space-y-6 text-on-surface-variant leading-relaxed">
                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">1. Payment Terms</h3>
                    <p>
                      Gyral offers certain premium features via one-time and recurring payments processed through Razorpay
                      (for UPI, Google Pay, PhonePe, and Indian payment methods) and PayPal (for international cards and
                      wallets).
                    </p>
                    <p className="mt-2">
                      All amounts are displayed in Indian Rupees (INR) unless otherwise specified. Payment processing
                      fees, if any, are included in the displayed price.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">2. Refund Eligibility</h3>
                    <p>We believe in fair outcomes. Refunds are available under the following conditions:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Duplicate or erroneous charges — full refund within 7 business days.</li>
                      <li>Service not delivered as described — full refund upon verification.</li>
                      <li>Technical issues preventing access — prorated refund for downtime.</li>
                      <li>Cancellation within 48 hours of purchase — full refund, no questions asked.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">3. Refund Process</h3>
                    <p>
                      To request a refund, email us with your registered email, transaction ID, and reason for the
                      refund. Refunds are typically processed within 5–10 business days after approval. The refund will be
                      credited to the original payment method.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-white font-headline-sm text-lg uppercase font-semibold mb-2">4. Non-Refundable Items</h3>
                    <p>
                      The following are not eligible for refunds: completed one-time services that have been fully
                      delivered, voluntary penalty payments made through the Iron Bank system (as these are self-imposed
                      accountability mechanisms), and any charges older than 90 days.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="font-headline-md text-headline-md text-white mb-2 uppercase font-semibold">Secure Contact</h2>
                  <p className="text-sm text-primary uppercase font-semibold">Direct transmission</p>
                </div>
                <div className="w-12 h-0.5 bg-primary"></div>

                <div className="space-y-6 text-on-surface-variant leading-relaxed">
                  <section>
                    <p>
                      For support, questions, feedback, or any billing queries, you can transmit a message directly to
                      our core support framework. We prioritize active user requests.
                    </p>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="marble-border p-6 bg-surface-container-lowest rounded">
                      <p className="font-label-sm text-[10px] text-primary uppercase font-semibold mb-1">Support Transmission</p>
                      <a href="mailto:support@gyral.app" className="text-white font-medium hover:text-primary transition-colors">
                        support@gyral.app
                      </a>
                    </div>
                    <div className="marble-border p-6 bg-surface-container-lowest rounded">
                      <p className="font-label-sm text-[10px] text-primary uppercase font-semibold mb-1">Legal Transmission</p>
                      <a href="mailto:legal@gyral.app" className="text-white font-medium hover:text-primary transition-colors">
                        legal@gyral.app
                      </a>
                    </div>
                  </section>

                  <section className="pt-4">
                    <h4 className="text-white font-medium uppercase text-sm mb-2">Transmission Response Time</h4>
                    <p>
                      Our processors run Mon-Sat, 10:00 AM — 7:00 PM IST. Support queries are standardly resolved
                      within 24–48 hours. Include &quot;URGENT&quot; in your signal header if critical.
                    </p>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-primary">Loading Registry...</div>}>
      <LegalContent />
    </Suspense>
  );
}
