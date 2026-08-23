import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ArrowRight, Phone, MessageSquare } from "lucide-react";
import { FaqClient } from "@/components/faq/FaqClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Swan Swim School",
  description:
    "Find answers to common questions about swim programs, trial bookings, class ratios, tuition, deposits, and safety policies at Swan Swim School.",
};

export default function FaqPage() {
  return (
    <>
      {/* Hero Section */}
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
            <HelpCircle size={16} />
            Help & Answers
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Everything you need to know about our swim classes, trial lessons,
            schedules, and enrollment process.
          </p>
        </div>
      </section>

      {/* Interactive FAQ Content */}
      <section className="pt-8 pb-16 bg-white">
        <FaqClient />
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto mb-8">
            Our friendly team is always here to help you choose the best swim
            path for your family.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="btn-primary !py-3.5 !px-8 text-base group"
            >
              <MessageSquare size={18} />
              Contact Our Team
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/trial"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-white hover:border-slate-400 hover:shadow-xs transition-all text-base"
            >
              Book a Free Trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
