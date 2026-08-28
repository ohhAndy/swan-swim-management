import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ContactLocations } from "@/components/contact/ContactLocations";

export const metadata: Metadata = {
  title: "Contact & Locations — Swan Swim School",
  description:
    "Find Swan Swim School locations in Newmarket, Markham, and Angus Glen. Check hours, phone numbers, addresses, and directions.",
};

export default function ContactPage() {
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
            <MessageCircle size={16} />
            We&apos;d Love to Hear from You
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Contact & Locations
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Choose a location below to view directions, direct phone numbers, facility hours, and pool amenities.
          </p>
        </div>
      </section>

      {/* Interactive Location Tabs & Details */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="section-container">
          <ContactLocations />
        </div>
      </section>
    </>
  );
}
