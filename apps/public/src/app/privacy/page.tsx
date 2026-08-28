import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Swan Swim School",
  description:
    "Learn how Swan Swim School collects, uses, protects, and handles your family's personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0,32 C480,80 960,0 1440,32 L1440,80 L0,80 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="section-container relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
            <Shield size={16} />
            Data Protection & Privacy
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/80 text-base max-w-xl mx-auto">
            Last updated: February 2026. How we protect and respect your family&apos;s privacy.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="section-container max-w-3xl">
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-base leading-relaxed">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                1. Information We Collect
              </h2>
              <p>
                When you enroll in classes, book a free assessment trial, or contact Swan Swim School, we collect information necessary to deliver safe aquatic instruction:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong className="text-slate-800">Guardian Details:</strong> Name, phone number, email address, emergency contact information, and billing address.
                </li>
                <li>
                  <strong className="text-slate-800">Student Details:</strong> Name, date of birth / age, swimming skill level, and any relevant medical/safety considerations.
                </li>
                <li>
                  <strong className="text-slate-800">Payment Information:</strong> When processing payments, card and transaction details are handled securely via PCI-compliant payment processors. We do not store raw card numbers on our servers.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                2. How We Use Your Information
              </h2>
              <p>We use your information exclusively to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Schedule and administer swimming lessons, skill evaluations, and trials.</li>
                <li>Communicate class updates, schedule changes, and weather alerts.</li>
                <li>Process tuition payments, invoices, and receipts.</li>
                <li>Ensure student safety and provide immediate emergency response if needed.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                3. Information Sharing & Protection
              </h2>
              <p>
                We never sell, rent, or trade your personal information. Information is only shared with authorized instructors and administrative staff on a strict need-to-know basis. All digital records are encrypted and stored in secure cloud infrastructure adhering to Canadian privacy regulations (PIPEDA).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                4. Photography & Media Policy
              </h2>
              <p>
                To protect student privacy, photography or video recording in changing rooms is strictly prohibited. Photos or videos taken during public showcase events are only published with explicit guardian consent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                5. Contact Our Privacy Officer
              </h2>
              <p>
                If you have questions about your personal data or wish to update or delete your information, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <p className="font-semibold text-slate-900">Swan Swim School — Privacy Department</p>
                <p className="mt-1">Email: <a href="mailto:info@swanswimschool.com" className="text-brand-600 font-medium hover:underline">info@swanswimschool.com</a></p>
                <p>Phone: <a href="tel:2897639339" className="text-brand-600 font-medium hover:underline">(289) 763-9339</a></p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                View Terms of Service &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
