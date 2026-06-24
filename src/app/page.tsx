"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Scroll reveal logic using IntersectionObserver
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    // Navbar scroll listener
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="font-body-md bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-x-hidden">
      <div className="grain-overlay"></div>

      {/* Navigation */}
      <nav
        id="top-nav"
        className={`fixed top-0 w-full z-50 transition-all duration-300 flex justify-between items-center px-margin-desktop border-b border-surface-container-highest backdrop-blur-xl ${
          isScrolled ? "h-16 bg-surface/95" : "h-20 bg-surface/90"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">shield</span>
          <span className="font-headline-lg text-[28px] tracking-tight text-primary font-medium">GYRAL</span>
        </div>
        <div className="hidden md:flex items-center space-x-12">
          <Link
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase font-semibold"
            href="/login"
          >
            Log In
          </Link>
          <Link
            className="px-8 py-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all duration-300 active:scale-95 uppercase font-semibold"
            href="/login"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Side Indicators */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-6 z-40">
        <span className="text-vertical font-label-sm text-label-sm text-on-surface-variant/40 tracking-[0.3em] uppercase">
          Cognitive Architecture 2026
        </span>
        <div className="w-px h-32 bg-surface-container-highest"></div>
        <div className="flex flex-col gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary gold-glow"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
        </div>
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section className="min-h-screen pt-40 px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-16 overflow-hidden">
          <div className="md:w-1/2 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-green-500/30 bg-green-500/5 mb-8 reveal-on-scroll visible">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-label-sm text-[10px] text-green-500 tracking-widest uppercase font-semibold">
                Cognitive Architecture
              </span>
            </div>
            <h1
              className="font-display-lg text-display-lg text-on-surface mb-8 reveal-on-scroll visible font-semibold"
              style={{ transitionDelay: "100ms" }}
            >
              FORGE YOUR <br />
              <span className="italic font-light text-primary">DISCIPLINE</span>
            </h1>
            <p
              className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-12 reveal-on-scroll visible"
              style={{ transitionDelay: "200ms" }}
            >
              A system built for those who refuse to settle for mediocrity. Gyral’s architecture is engineered for human
              peak performance.
            </p>
            <div className="flex flex-wrap gap-6 reveal-on-scroll visible" style={{ transitionDelay: "300ms" }}>
              <Link
                className="px-10 py-4 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all duration-300 active:scale-95 uppercase font-semibold"
                href="/login"
              >
                Start Your Journey
              </Link>
              <Link
                className="px-10 py-4 border border-primary text-primary font-label-md text-label-md hover:bg-primary/5 transition-all duration-300 uppercase font-semibold"
                href="#features"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div
            className="md:w-1/2 relative reveal-on-scroll flex justify-center items-center visible"
            style={{ transitionDelay: "200ms" }}
          >
            <div className="absolute w-[120%] aspect-square border border-surface-container-highest rounded-full -z-10 opacity-20"></div>
            <div className="absolute w-[80%] aspect-square border border-primary/20 rounded-full -z-10 animate-pulse"></div>
            <div className="relative w-full max-w-lg aspect-square">
              <img
                className="w-full h-full object-contain filter grayscale brightness-110 drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdCxAV-irCOv7yTk2IG63iiNLC_zrtE7yiZz-OMF4cCz_L27DdlrqdPOkbFZ6tkfvlqDgA9sjjWD5Ci2TuU6XDNi5zX3212nXIp8HMEVGr73RVtGugWMG8iWIrMB5-bADVGgouqE4Yk4KuD7Ze7mVSeY2SqMh4sIcr7YBPR3W9UrLlcVerALtssZn7-ss60BmjL5G2bh9Yvjq-fiRivLZdFjVysE6VYb-Ae1uOyul8sT_D0UWC4Imi6kIWtK2R68EXGYCVT8NpmIcN"
                alt="Peak Performance visualization"
                crossOrigin="anonymous"
              />
              <div
                className="absolute top-1/4 -right-8 marble-border bg-surface-container/80 backdrop-blur-md p-4 flex flex-col gap-1 reveal-on-scroll visible"
                style={{ transitionDelay: "500ms" }}
              >
                <span className="font-label-sm text-[10px] text-primary uppercase font-semibold">Status</span>
                <span className="font-body-md text-on-surface uppercase font-medium">Peak_State_01</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-margin-desktop py-section-gap" id="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="marble-border p-10 bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-500 reveal-on-scroll visible">
              <span className="material-symbols-outlined text-primary text-4xl mb-8">target</span>
              <h3 className="font-headline-sm text-headline-sm mb-4 font-semibold text-white">Goal Tracking</h3>
              <p className="font-body-md text-on-surface-variant">Set, measure, and crush your targets with precision.</p>
            </div>
            {/* Feature 2 */}
            <div
              className="marble-border p-10 bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-500 reveal-on-scroll visible"
              style={{ transitionDelay: "100ms" }}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-8">local_fire_department</span>
              <h3 className="font-headline-sm text-headline-sm mb-4 font-semibold text-white">Habit Forge</h3>
              <p className="font-body-md text-on-surface-variant">Build unbreakable routines through daily discipline.</p>
            </div>
            {/* Feature 3 */}
            <div
              className="marble-border p-10 bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-500 reveal-on-scroll visible"
              style={{ transitionDelay: "200ms" }}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-8">psychology</span>
              <h3 className="font-headline-sm text-headline-sm mb-4 font-semibold text-white">AI Mentor</h3>
              <p className="font-body-md text-on-surface-variant">Personalized insights powered by Gemini intelligence.</p>
            </div>
            {/* Feature 4 */}
            <div
              className="marble-border p-10 bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-500 reveal-on-scroll visible"
              style={{ transitionDelay: "300ms" }}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-8">bolt</span>
              <h3 className="font-headline-sm text-headline-sm mb-4 font-semibold text-white">Iron Bank</h3>
              <p className="font-body-md text-on-surface-variant">Self-imposed penalties that turn failure into fuel.</p>
            </div>
          </div>
        </section>

        {/* Legal Tabs Sections */}
        <section className="px-margin-desktop py-section-gap">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Terms */}
            <div
              className="md:col-span-8 marble-border p-12 relative overflow-hidden group hover:border-primary/40 transition-colors duration-700 reveal-on-scroll visible"
              id="terms"
            >
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-surface-container-highest text-8xl opacity-10">gavel</span>
              </div>
              <p className="font-label-sm text-label-sm text-primary-container mb-4 uppercase font-semibold">Section 01</p>
              <h2 className="font-headline-lg text-headline-lg mb-6 uppercase font-semibold text-white">Terms of Service</h2>
              <p className="font-body-lg text-on-surface-variant leading-relaxed mb-8 max-w-xl">
                The foundational code of the Gyral architecture. By entering, you commit to absolute system integrity and
                intellectual property reverence. Failure to comply results in immediate archival termination.
              </p>
              <div className="flex justify-start">
                <Link
                  className="px-8 py-3 border border-primary text-primary font-label-md text-label-md hover:bg-primary/5 transition-all uppercase font-semibold"
                  href="/legal?tab=terms"
                >
                  View Full Treaty
                </Link>
              </div>
            </div>
            {/* Privacy */}
            <div
              className="md:col-span-4 marble-border p-12 bg-surface-container-low flex flex-col justify-between reveal-on-scroll visible"
              id="privacy"
              style={{ transitionDelay: "100ms" }}
            >
              <div>
                <p className="font-label-sm text-label-sm text-primary-container mb-4 uppercase font-semibold">Section 02</p>
                <h2 className="font-headline-md text-headline-md mb-6 uppercase font-semibold text-white">Privacy Archive</h2>
                <p className="font-body-md text-on-surface-variant mb-8">
                  Your biological and digital data is encrypted within our carbon-fiber vault. We maintain zero third-party
                  exposure through AES-256 archival protocols.
                </p>
              </div>
              <div className="mt-auto">
                <Link
                  className="w-full inline-block text-center py-4 border border-primary-container font-label-md text-label-md hover:bg-primary-container/10 transition-colors uppercase font-semibold"
                  href="/legal?tab=privacy"
                >
                  Open Registry
                </Link>
              </div>
            </div>
            {/* Refund */}
            <div className="md:col-span-6 marble-border p-12 reveal-on-scroll visible" id="refund">
              <p className="font-label-sm text-label-sm text-primary-container mb-4 uppercase font-semibold">Section 03</p>
              <h2 className="font-headline-md text-headline-md mb-6 uppercase font-semibold text-white">Refunds &amp; Assurance</h2>
              <p className="font-body-md text-on-surface-variant mb-8">
                Precision is our standard. If the system fails to deliver the promised framework, we offer a 14-day archival
                refund window with instant credit recovery and no questions asked.
              </p>
              <Link
                className="inline-block px-8 py-3 border border-primary/30 font-label-md text-label-md hover:border-primary hover:text-primary transition-all uppercase font-semibold"
                href="/legal?tab=refund"
              >
                Assurance Protocol
              </Link>
            </div>
            {/* Contact */}
            <div
              className="md:col-span-6 border-l border-primary/20 p-12 bg-surface-container-lowest reveal-on-scroll visible"
              id="contact"
              style={{ transitionDelay: "100ms" }}
            >
              <p className="font-label-sm text-label-sm text-primary-container mb-4 uppercase font-semibold">Section 04</p>
              <h2 className="font-headline-md text-headline-md mb-6 uppercase font-semibold text-white">Secure Contact</h2>
              <p className="font-body-md text-on-surface-variant mb-8">
                Direct transmission to the core architecture. Our response time is optimized for peak efficiency, ensuring
                your resolution is handled with absolute priority.
              </p>
              <Link
                className="group w-full py-4 bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-3 transition-transform active:scale-95 uppercase font-semibold"
                href="/legal?tab=contact"
              >
                <span>Transmit Message</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-margin-desktop py-section-gap bg-surface-container-lowest text-center border-y border-surface-container-highest">
          <div className="max-w-3xl mx-auto reveal-on-scroll visible">
            <h2 className="font-headline-lg text-headline-lg mb-6 italic uppercase font-semibold text-white">
              Begin Your Transformation
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">
              Join a system designed to forge discipline out of chaos. The path to your ultimate version starts here.
            </p>
            <Link
              className="inline-block px-12 py-5 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all duration-300 active:scale-95 uppercase font-semibold"
              href="/login"
            >
              Enter Gyral
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-container-highest relative w-full py-24">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop w-full mx-auto gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shield</span>
              <span className="font-headline-lg text-[32px] text-primary uppercase font-semibold">Gyral</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60 uppercase font-semibold">Est. MMXXIV</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <Link
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase font-semibold"
              href="/legal?tab=privacy"
            >
              Privacy
            </Link>
            <Link
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase font-semibold"
              href="/legal?tab=terms"
            >
              Terms
            </Link>
            <Link
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase font-semibold"
              href="/legal?tab=refund"
            >
              Refund
            </Link>
            <Link
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase font-semibold"
              href="/legal?tab=contact"
            >
              Contact
            </Link>
          </div>
          <div className="text-center md:text-right">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              © 2026 Gyral. All Rights Reserved.
            </p>
            <div className="flex justify-center md:justify-end gap-6 mt-6">
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">
                language
              </span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">
                fingerprint
              </span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer">
                verified_user
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
