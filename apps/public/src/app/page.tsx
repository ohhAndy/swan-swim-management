import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { EditorialHero } from "@/components/home/EditorialHero";
import { StorySection } from "@/components/home/StorySection";
import { ScrapbookGallery } from "@/components/home/ScrapbookGallery";
import { ParentStories } from "@/components/home/ParentStories";
import { ScrollReveal } from "@/components/common/ScrollReveal";

export default function HomePage() {
  return (
    <>
      {/* 1. EDITORIAL HERO WITH ASYMMETRICAL PHOTO COLLAGE */}
      <EditorialHero />

      {/* 2. THE STORY: "WE TEACH CONFIDENCE, NOT JUST STROKES" */}
      <StorySection />

      {/* 3. THE FAMILY SCRAPBOOK (SCATTERED POLAROIDS & MEMORY BOARD) */}
      <ScrapbookGallery />

      {/* 4. STORIES FROM PROUD LOCAL PARENTS */}
      <ParentStories />

      {/* 5. WARM CLOSING INVITATION */}
      <section className="relative py-28 sm:py-32 overflow-hidden bg-gradient-to-br from-[#11527e] via-brand-700 to-brand-800 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="section-container relative z-10 text-center">
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 border border-white/20">
              <Heart size={15} className="fill-rose-400 text-rose-400" />
              100% Free Trial • No Obligation
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold !text-white mb-6 tracking-tight">
              Come see what it means to swim like no other.
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Book a complimentary 30-minute trial class. No obligation, no pressure —
              just you, your child, and a coach who's ready to meet them where they are.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/trial"
                className="btn-primary !bg-white !text-brand-800 hover:!bg-slate-50 !py-4 !px-8 !text-lg !rounded-2xl !shadow-2xl font-bold group"
              >
                Book a Free Trial Lesson
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/about"
                className="btn-secondary !text-white !border-white/30 hover:!bg-white/10 !py-4 !px-8 !text-lg !rounded-2xl font-semibold"
              >
                Learn More About Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
