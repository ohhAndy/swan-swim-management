"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Calendar,
  CreditCard,
  ShieldCheck,
  GraduationCap,
  MessageCircleQuestion,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "getting-started" | "classes" | "payments" | "safety";
}

const faqs: FAQItem[] = [
  {
    category: "getting-started",
    question: "How do I book a free trial class?",
    answer:
      "Booking a trial is easy and takes less than two minutes! Click the 'Book a Free Trial' button, fill in your contact information and your child's age, and select an available date and time slot from our live calendar. Our team will review the request and confirm your child's placement.",
  },
  {
    category: "getting-started",
    question: "What happens during the trial lesson?",
    answer:
      "During the 30-minute trial session, one of our certified instructors will gently assess your child's comfort level in the water, basic swimming skills, and confidence. This allows us to recommend the exact class level where your child will thrive, learn safely, and have fun.",
  },
  {
    category: "getting-started",
    question: "What should my child bring and wear on their first day?",
    answer:
      "Please bring a fitted swimsuit, a towel, and swim goggles (optional for beginners). For toddlers who are not yet toilet trained, an approved reusable swim diaper is required. We provide all kickboards, floatation aids, and pool toys.",
  },
  {
    category: "getting-started",
    question: "How do you determine which program level is right for my child?",
    answer:
      "Placement is based on both age and current swimming proficiency. Younger swimmers (ages 3–5) usually start in Preschool Swimmers, while school-age children begin in Skill Builders. Our trial lesson is specifically designed to assess and place your child into the ideal tier.",
  },
  {
    category: "classes",
    question: "What is your student-to-instructor ratio?",
    answer:
      "We strictly limit class sizes to ensure personalized attention and optimal safety. Our Preschool Swimmer classes maintain a 3:1 ratio, Skill Builders classes are 4:1, and Advanced levels are 6:1. We also offer 1:1 and 2:1 private lessons.",
  },
  {
    category: "classes",
    question: "How are classes scheduled throughout the year?",
    answer:
      "We run seasonal terms (Fall, Winter, Spring, and Summer). Classes meet once or twice per week at a consistent scheduled time slot. You can view all upcoming term offerings and available time slots in our program guide.",
  },
  {
    category: "classes",
    question: "What if my child misses a class due to illness or travel?",
    answer:
      "We understand that life happens! Parents can easily request make-up classes through our Parent Portal. As long as you notify us in advance of the absence, you will receive a make-up credit that can be booked in an open slot during the active term.",
  },
  {
    category: "classes",
    question: "Can I schedule multiple siblings at the same time?",
    answer:
      "Yes! We strive to make scheduling as convenient as possible for families. We offer concurrent class times across different age tiers so siblings can swim in parallel sessions during the same visit.",
  },
  {
    category: "payments",
    question: "How does the registration deposit work?",
    answer:
      "To hold your child's spot in a preferred class offering, a registration deposit is collected securely online via credit card or Apple Pay / Google Pay. Once staff confirms class balance and student placement, the deposit is credited toward your term tuition.",
  },
  {
    category: "payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, Apple Pay, and Google Pay through our secure, PCI-compliant Stripe checkout system.",
  },
  {
    category: "payments",
    question: "How do I receive receipts for tax credits and tracking?",
    answer:
      "Whenever a deposit or tuition payment is processed, an official itemized receipt is instantly emailed to your registered email address with complete transaction details, perfect for family records and childcare tax deductions.",
  },
  {
    category: "payments",
    question: "What is your cancellation and refund policy?",
    answer:
      "If you need to cancel before the term begins, we provide full refunds (less a small administrative fee) with at least 14 days' written notice. In cases of medical necessity accompanied by a doctor's note, prorated credits will be provided.",
  },
  {
    category: "safety",
    question: "What qualifications and certifications do your coaches hold?",
    answer:
      "All Swan Swim School instructors are certified Red Cross / Lifesaving Society Water Safety Instructors (WSI), hold active CPR-C and Standard First Aid certifications, and undergo comprehensive background checks and in-house training.",
  },
  {
    category: "safety",
    question: "What are your pool water temperature and sanitization standards?",
    answer:
      "Our indoor pool is maintained at a comfortable, warm 88°F (31°C) — ideal for young children and infants to prevent shivering. Our water undergoes automated continuous UV filtration and multi-daily chemical checks to ensure pristine cleanliness.",
  },
  {
    category: "safety",
    question: "Can parents stay and watch the swim lessons?",
    answer:
      "Absolutely! We have a comfortable, temperature-controlled parent viewing lounge with floor-to-ceiling glass overlooking the pool deck, as well as high-speed Wi-Fi so you can watch your child's progress with ease.",
  },
];

const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "getting-started", label: "Getting Started & Trials", icon: Sparkles },
  { id: "classes", label: "Classes & Scheduling", icon: Calendar },
  { id: "payments", label: "Tuition & Deposits", icon: CreditCard },
  { id: "safety", label: "Safety & Facility", icon: ShieldCheck },
];

export function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="section-container">
      {/* Search & Filter Section */}
      <div className="max-w-3xl mx-auto mb-12 -mt-6">
        <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 sm:p-3 flex items-center gap-3">
          <Search size={22} className="text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Search questions (e.g. trial, make-up, pricing, safety)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base focus:outline-none py-2"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1 bg-slate-100 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-2 scrollbar-none justify-start sm:justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="max-w-3xl mx-auto mb-20 space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-brand-300 bg-white shadow-lg shadow-brand-500/5"
                    : "border-slate-200/80 bg-white hover:border-slate-300 shadow-xs"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`font-display font-semibold text-base sm:text-lg transition-colors ${
                      isOpen ? "text-brand-600" : "text-slate-900"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "bg-brand-50 text-brand-600 rotate-180"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 animate-fade-in">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <MessageCircleQuestion
              size={48}
              className="text-slate-400 mx-auto mb-4"
            />
            <h3 className="font-display font-bold text-lg text-slate-800 mb-2">
              No matching questions found
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;.
              Feel free to reach out directly and our team will be happy to help!
            </p>
            <Link
              href="/contact"
              className="btn-primary !py-2.5 !px-6 !text-sm"
            >
              Contact Support
            </Link>
          </div>
        )}
      </div>

      {/* Quick Help / Trust Banner */}
      <div className="max-w-4xl mx-auto mb-20 bg-gradient-to-br from-brand-50 to-teal-50/50 rounded-3xl p-8 sm:p-12 border border-brand-100">
        <div className="grid md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center mb-4 shadow-md shadow-brand-500/20">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-display font-bold text-slate-900 text-lg mb-1">
              Zero Commitment
            </h4>
            <p className="text-slate-600 text-sm">
              Free trial lessons come with no obligation to register. Experience our coaching first.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center mb-4 shadow-md shadow-teal-500/20">
              <GraduationCap size={24} />
            </div>
            <h4 className="font-display font-bold text-slate-900 text-lg mb-1">
              Certified Instructors
            </h4>
            <p className="text-slate-600 text-sm">
              100% Red Cross / Lifesaving Society certified coaches with first-aid & CPR training.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 rounded-xl bg-warm-500 text-white flex items-center justify-center mb-4 shadow-md shadow-warm-500/20">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-display font-bold text-slate-900 text-lg mb-1">
              Warm 88°F Pool
            </h4>
            <p className="text-slate-600 text-sm">
              Consistently heated indoor pool with automated UV sanitization for student comfort.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
