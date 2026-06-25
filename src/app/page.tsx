"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  FileText,
  Mail,
  RefreshCcw,
  ChevronRight,
  ArrowUpRight,
  Eye,
  Server,
  Trash2,
  CreditCard,
  Clock,
  MessageCircle,
  CheckCircle,
  Zap,
  Target,
  Brain,
  Flame,
} from "lucide-react";
import Link from "next/link";

/* ─── Tab definitions ─── */
const TABS = [
  { id: "terms", label: "Terms of Service", icon: FileText },
  { id: "privacy", label: "Privacy Policy", icon: Lock },
  { id: "contact", label: "Contact Us", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ─── Shared animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Reusable section card ─── */
function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="absolute -top-px -left-px w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <Icon className="w-4 h-4 text-emerald-400/80" />
          </div>
          <h3 className="text-base font-medium tracking-wide text-white/90">{title}</h3>
        </div>
        <div className="text-[0.9rem] leading-[1.75] text-white/50 space-y-3">{children}</div>
      </div>
    </motion.div>
  );
}

/* ─── Feature Card for Hero ─── */
function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative flex flex-col items-center text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-emerald-400/20 hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-400/[0.08] border border-emerald-400/[0.12] mb-4 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h3 className="text-sm font-medium text-white/90 mb-1.5">{title}</h3>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── Terms of Service Content ─── */
function TermsContent() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <SectionCard icon={FileText} title="Agreement to Terms">
        <p>
          By accessing and using Gyral (&quot;the Platform&quot;), you agree to be bound by these Terms
          of Service. If you do not agree, you must discontinue use of the Platform immediately.
        </p>
        <p>
          Gyral is a personal cognitive architecture and habit formation system. You must be at least
          16 years old to use this service.
        </p>
      </SectionCard>

      <SectionCard icon={Eye} title="Acceptable Use">
        <p>You agree to use Gyral solely for lawful personal development purposes. You shall not:</p>
        <ul className="list-none space-y-2 mt-2">
          {[
            "Attempt to reverse-engineer, decompile, or disassemble any part of the Platform",
            "Use automated systems to scrape or extract data from the Platform",
            "Impersonate another person or misrepresent your identity",
            "Upload malicious code, viruses, or any harmful content",
            "Use the Platform for any commercial resale or redistribution",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60 mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Server} title="Service Availability">
        <p>
          Gyral is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the
          right to modify, suspend, or discontinue any aspect of the Platform at any time without prior
          notice. We do not guarantee uninterrupted, secure, or error-free operation of the service.
        </p>
      </SectionCard>

      <SectionCard icon={Shield} title="Intellectual Property">
        <p>
          All content, design, code, and intellectual property within Gyral remain the exclusive
          property of the Gyral team. Your personal data and user-generated content remain yours. By
          using the Platform, you grant us a limited license to process your data solely to provide
          the service.
        </p>
      </SectionCard>

      <SectionCard icon={FileText} title="Limitation of Liability">
        <p>
          Gyral shall not be liable for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the Platform. Our total liability shall not exceed the
          amount paid by you to Gyral in the twelve months preceding the claim.
        </p>
      </SectionCard>
    </motion.div>
  );
}

/* ─── Privacy Policy Content ─── */
function PrivacyContent() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <SectionCard icon={Eye} title="Information We Collect">
        <p>We collect the minimum information necessary to provide our services:</p>
        <ul className="list-none space-y-2 mt-2">
          {[
            "Account information: email address, display name, and profile photo",
            "Usage data: tasks, habits, goals, and progress you choose to track",
            "Device data: browser type, OS version, and screen resolution for optimization",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60 mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Lock} title="How We Use Your Data">
        <p>
          Your data is used exclusively to power your personal Gyral experience. We do not sell, rent,
          or trade your personal information to third parties. Data is used for:
        </p>
        <ul className="list-none space-y-2 mt-2">
          {[
            "Providing and personalizing the Platform experience",
            "Generating AI-powered insights via Gemini (processed without storing prompts)",
            "Sending critical account notifications (opt-in only)",
            "Improving Platform performance and reliability",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60 mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Shield} title="Data Security">
        <p>
          We employ industry-standard security measures including TLS encryption in transit,
          encrypted storage at rest via Supabase, and strict access controls. Your authentication is
          handled by Supabase Auth with secure session management.
        </p>
      </SectionCard>

      <SectionCard icon={Trash2} title="Data Deletion">
        <p>
          You may request complete deletion of your account and all associated data at any time by
          contacting us at the email listed in the Contact section. We will process deletion requests
          within 30 business days.
        </p>
      </SectionCard>
    </motion.div>
  );
}



/* ─── Contact Content ─── */
function ContactContent() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <SectionCard icon={Mail} title="Get in Touch">
        <p>
          We value every message. Whether you have questions, feedback, or need support, reach out to
          us through the following channels:
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <Mail className="w-4 h-4 text-emerald-400/80 shrink-0" />
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Email</p>
              <a
                href="mailto:support@gyral.app"
                className="text-white/90 hover:text-emerald-400 transition-colors"
              >
                support@gyral.app
              </a>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={MessageCircle} title="Response Times">
        <p>
          We aim to respond to all inquiries within 24–48 hours during business days. For urgent
          matters, please include &quot;URGENT&quot; in your email subject line. Support is available
          Monday through Saturday, 10:00 AM — 7:00 PM IST.
        </p>
      </SectionCard>

      <SectionCard icon={Shield} title="Business Information">
        <p>
          <strong className="text-white/70">Gyral</strong>
          <br />
          A cognitive architecture and self-improvement platform.
          <br />
          <br />
          For legal correspondence, reach us at:{" "}
          <a
            href="mailto:legal@gyral.app"
            className="text-emerald-400/80 hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-emerald-400/30"
          >
            legal@gyral.app
          </a>
        </p>
      </SectionCard>
    </motion.div>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("terms");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const renderContent = () => {
    switch (activeTab) {
      case "terms":
        return <TermsContent />;
      case "privacy":
        return <PrivacyContent />;
      case "contact":
        return <ContactContent />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ── Content Container ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-8">

        {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
        <section className="pt-16 md:pt-28 pb-16 md:pb-24">
          {/* Top Nav Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-16 md:mb-24"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400/60" />
              <span className="text-sm font-medium tracking-[0.15em] text-white/70 uppercase">Gyral</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs text-white/40 hover:text-white/70 transition-colors duration-300 tracking-wider uppercase px-4 py-2"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="text-xs text-black bg-white hover:bg-white/90 transition-all duration-300 tracking-wider uppercase px-5 py-2.5 rounded-lg font-medium hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Sign up
              </Link>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400/80 tracking-widest uppercase">Cognitive Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white/95 mb-6 leading-[1.1]">
              Forge Your
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                Discipline
              </span>
            </h1>

            <p className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
              A system built for those who refuse to settle. Track habits, conquer goals,
              and hold yourself accountable — with an AI mentor by your side.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-black font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Start Your Journey
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="#compliance"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm text-white/50 hover:text-white/80 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            <FeatureCard icon={Target} title="Goal Tracking" desc="Set, measure, and crush your targets with precision" />
            <FeatureCard icon={Flame} title="Habit Forge" desc="Build unbreakable routines through daily discipline" />
            <FeatureCard icon={Brain} title="AI Mentor" desc="Personalized insights powered by Gemini intelligence" />
            <FeatureCard icon={Zap} title="Iron Bank" desc="Self-imposed penalties that turn failure into fuel" />
          </motion.div>
        </section>

        {/* ═══════════════════════ DIVIDER ═══════════════════════ */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ═══════════════════════ COMPLIANCE SECTION ═══════════════════════ */}
        <section id="compliance" className="py-16 md:py-24">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white/95 mb-3">
              Legal &amp; Compliance
            </h2>
            <p className="text-sm text-white/35 max-w-lg leading-relaxed">
              Transparency is a core principle. Here you&apos;ll find everything about how we operate,
              protect your data, and handle payments.
            </p>
            <div className="mt-4 text-xs text-white/20 tracking-wide">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </motion.header>

          {/* Tab Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10 md:mb-14"
          >
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all duration-300
                      ${
                        isActive
                          ? "bg-white/[0.08] text-white border border-white/[0.12] shadow-[0_0_20px_rgba(52,211,153,0.08)]"
                          : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400/80" : ""}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute inset-0 rounded-xl border border-emerald-400/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.nav>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ═══════════════════════ BOTTOM CTA ═══════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pb-8"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-emerald-500/[0.02] to-transparent p-8 md:p-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl font-light text-white/90 mb-2">
                  Begin your transformation
                </h2>
                <p className="text-sm text-white/40 max-w-md leading-relaxed">
                  Join a system designed to forge discipline, track growth, and unlock your potential.
                  Your journey starts with a single step.
                </p>
              </div>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] shrink-0"
              >
                Enter Gyral
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="py-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-white/20 tracking-wide">
            © {new Date().getFullYear()} Gyral. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  document.getElementById("compliance")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs text-white/20 hover:text-white/50 transition-colors duration-300"
              >
                {tab.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
