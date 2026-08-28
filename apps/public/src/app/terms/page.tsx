import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service & School Policies — Swan Swim School",
  description:
    "Swan Swim School terms of service, tuition payment terms, cancellation, makeup lessons, and pool safety rules.",
};

export default function TermsPage() {
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
            <FileText size={16} />
            Agreement & Policies
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-white/80 text-base max-w-xl mx-auto">
            Last updated: February 2026. Enrollment agreement, payment processing terms, and facility rules.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="section-container max-w-3xl">
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-base leading-relaxed">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                1. Enrollment & Registration
              </h2>
              <p>
                By enrolling a student at Swan Swim School (whether online, over the phone, or in person), you agree to these Terms of Service. Registration is confirmed upon receipt of tuition payment or term deposit.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                2. Tuition & Payment Terms
              </h2>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong className="text-slate-800">Payment Schedules:</strong> Tuition is due prior to the start of each term or billing cycle.
                </li>
                <li>
                  <strong className="text-slate-800">Accepted Methods:</strong> We accept major credit cards, debit, electronic funds transfers (e-Transfer), and authorized recurring payments.
                </li>
                <li>
                  <strong className="text-slate-800">Late Payments:</strong> Unpaid balances past the invoice due date may result in a temporary suspension of class attendance.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                3. Cancellations & Makeup Lessons
              </h2>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong className="text-slate-800">Absence Notification:</strong> Please notify reception at least 24 hours before a missed class to qualify for a makeup token.
                </li>
                <li>
                  <strong className="text-slate-800">Makeup Limits:</strong> Students are eligible for up to 2 makeup lessons per term, subject to pool lane availability.
                </li>
                <li>
                  <strong className="text-slate-800">Withdrawals:</strong> Cancellations made at least 14 days before the start of a term are eligible for a refund less an administrative fee.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                4. Facility Safety & Medical Disclosures
              </h2>
              <p>
                The safety of our students and staff is our highest priority. All swimmers must abide by facility guidelines, including proper swimwear and following instructor directions. Guardians must disclose any medical conditions, allergies, or physical considerations upon registration.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                5. Questions & Support
              </h2>
              <p>
                If you have questions regarding your invoices, account, or lesson policies, please reach out to our administration team:
              </p>
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <p className="font-semibold text-slate-900">Swan Swim School Administration</p>
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
                href="/privacy"
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                View Privacy Policy &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
