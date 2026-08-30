import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Star, Flame, Users } from "lucide-react";
import { ScrollReveal } from "@/components/common/ScrollReveal";

export function EditorialHero() {
  return (
    <section className="relative pt-32 pb-28 md:pt-36 md:pb-36 lg:pt-40 lg:pb-44 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
      {/* Warm sunlit ambient glows over deep ocean blue */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-3xl pointer-events-none -ml-28" />
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <ScrollReveal animation="fade-up" delay={0}>
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-teal-300 animate-pulse" />
                Now Enrolling — Markham & Newmarket
              </div>
            </ScrollReveal>

            {/* Headline with Gold Highlight */}
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold text-white leading-[1.08] tracking-tight mb-6">
                Swim like{" "}
                <span className="relative inline-block text-amber-300 italic font-serif font-normal">
                  no other
                  <svg
                    className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 w-full h-2.5 sm:h-3 text-amber-300"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M3 14 Q 50 2 97 14"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>
            </ScrollReveal>

            {/* Subtitle */}
            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal">
                At Swan, small class sizes, warm water, and coaches who genuinely care
                combine to create a swim experience your child will actually look forward to —
                every single week.
              </p>
            </ScrollReveal>

            {/* Quick Action Bar */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-white/20 max-w-lg mx-auto lg:mx-0 mb-8 text-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-700 text-xs sm:text-sm font-semibold w-full sm:w-auto">
                    <MapPin size={16} className="text-brand-600 shrink-0" />
                    <span>Markham & Newmarket</span>
                  </div>
                  <Link
                    href="/trial"
                    className="btn-primary !bg-brand-600 hover:!bg-brand-700 !text-white !py-3 !px-6 !text-sm sm:!text-base !rounded-xl w-full sm:w-auto ml-auto font-bold flex items-center justify-center gap-2 group shadow-md shadow-brand-700/30 shrink-0"
                  >
                    Book a Free Trial
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Trust Markers */}
            <ScrollReveal animation="fade-up" delay={400}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-white/90 font-medium">
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                  <Flame size={15} className="text-amber-300" />
                  <span>90°F Warm Water</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                  <Users size={15} className="text-teal-300" />
                  <span>3:1 Small Class Ratio</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                  <Star size={15} className="fill-amber-300 text-amber-300" />
                  <span>4.9★ on Google (350+ Reviews)</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Asymmetrical Polaroid Photo Composition */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <ScrollReveal animation="scale-up" delay={250} className="w-full max-w-md">
              <div className="relative w-full">
                {/* Glowing backdrop halo */}
                <div className="absolute inset-0 bg-teal-400/20 rounded-3xl blur-2xl transform scale-105 -z-10" />

                {/* Main Photo */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 transform -rotate-1 hover:rotate-0 transition-transform duration-500 bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80"
                    alt="Young student smiling during a swim lesson at Swan Swim School"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                      Day 1 to Swimming Independently
                    </p>
                    <p className="font-display font-bold text-lg text-white">
                      Gentle encouragement every step of the way
                    </p>
                  </div>
                </div>

                {/* Overlapping Secondary Photo */}
                <div className="absolute -bottom-6 -left-6 w-44 sm:w-52 aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500 hidden sm:block bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=400&q=80"
                    alt="Child proudly celebrating swim milestone"
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Large Big Wave Transition into Story Section */}
      <div className="absolute -bottom-[1px] left-0 right-0 pointer-events-none leading-none z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-24 md:h-32 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C320,110 680,10 1040,75 C1220,100 1360,60 1440,50 L1440,120 L0,120 Z"
            fill="#f0f7fc"
          />
        </svg>
      </div>
    </section>
  );
}
