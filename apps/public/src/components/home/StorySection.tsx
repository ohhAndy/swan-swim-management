import React from "react";
import Image from "next/image";
import { Sparkles, Check } from "lucide-react";
import { ScrollReveal } from "@/components/common/ScrollReveal";

export function StorySection() {
  return (
    <section className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 bg-gradient-to-b from-[#f0f7fc] via-white to-[#f0f7fc] overflow-hidden">
      {/* Soft ambient water light */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Candid Visual Story */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <ScrollReveal animation="slide-left" delay={100}>
              <div className="relative">
                {/* Soft glowing halo */}
                <div className="absolute inset-0 bg-brand-300/20 rounded-3xl blur-2xl transform scale-105 -z-10" />

                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-slate-100 border-4 border-white">
                  <Image
                    src="https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=900&q=80"
                    alt="Coach high-fiving a child during swim lesson"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="font-serif italic text-lg text-slate-100 mb-1">
                      &ldquo;The moment a child stops being scared of the water is the moment everything changes.&rdquo;
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                      Mo & Farhad, Swan Swim School
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Editorial Narrative */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles size={14} className="text-brand-600" />
                The Swan Difference
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                We teach <span className="text-brand-600 font-serif italic font-normal">confidence</span>, not just strokes.
              </h2>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={150}>
              <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed mb-8 font-normal">
                <p>
                  For a lot of kids, the idea of putting their face in the water or letting go
                  of the wall is genuinely terrifying. Rushing them through drills doesn't help
                  — it just teaches them to dread next week's class.
                </p>
                <p>
                  At Swan, we meet every child where they are. Water games, steady encouragement,
                  warm pool water, and classes capped at 3 students mean no child gets left behind
                  or lost in the noise. Progress happens at their pace — and it sticks.
                </p>
              </div>
            </ScrollReveal>

            {/* Checkpoint Highlights */}
            <div className="space-y-3 pt-4 border-t border-brand-100/60">
              <ScrollReveal animation="fade-up" delay={250}>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-brand-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Patience Before Pacing</h4>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      We never force submersions. We build comfort naturally until your child takes the leap with a smile.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={350}>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-brand-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Small Classes Where Every Child is Seen</h4>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      Max 3:1 ratio for preschoolers means no waiting on cold steps or getting lost in a noisy crowd.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={450}>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-brand-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Milestone Tracking with Report Cards</h4>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      Every skill milestone is tracked and celebrated. Parents receive detailed report cards so they can see exactly how far their child has come.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>

      {/* Large Big Wave Transition into ScrapbookGallery */}
      <div className="absolute -bottom-[1px] left-0 right-0 pointer-events-none leading-none z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-24 md:h-32 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C480,120 960,-10 1440,60 L1440,120 L0,120 Z"
            fill="#eaf4fb"
          />
        </svg>
      </div>
    </section>
  );
}
