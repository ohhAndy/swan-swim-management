import React from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { ScrollReveal } from "@/components/common/ScrollReveal";

export function ScrapbookGallery() {
  const polaroids = [
    {
      caption: "Maya’s first splash with zero tears! 🌊",
      subtext: "Preschool Acclimatization • Markham",
      image:
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=700&q=80",
      rotation: "-rotate-2 hover:rotate-0",
      tapeColor: "bg-teal-400/90",
      tapeRotate: "-rotate-6",
      delay: 0,
    },
    {
      caption: "High-five for conquering the big dive! ✋",
      subtext: "Coach Marcus • Newmarket",
      image:
        "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=700&q=80",
      rotation: "rotate-2 hover:rotate-0",
      tapeColor: "bg-amber-400/90",
      tapeRotate: "rotate-3",
      delay: 120,
    },
    {
      caption: "“Look Mom, no hands!” Proud float moment 🥳",
      subtext: "Skill Builders • Markham",
      image:
        "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=700&q=80",
      rotation: "-rotate-1 hover:rotate-0",
      tapeColor: "bg-rose-400/90",
      tapeRotate: "-rotate-3",
      delay: 240,
    },
    {
      caption: "Level 2 Ribbon Day! Beaming with pride 🏅",
      subtext: "Graduation Celebration",
      image:
        "https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=700&q=80",
      rotation: "rotate-3 hover:rotate-0",
      tapeColor: "bg-brand-400/90",
      tapeRotate: "rotate-6",
      delay: 360,
    },
  ];

  return (
    <section className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 bg-gradient-to-b from-[#eaf4fb] via-sky-50/70 to-[#eaf4fb] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[420px] h-[420px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Header */}
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-brand-200 shadow-xs text-brand-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Heart size={14} className="fill-rose-500 text-rose-500" />
              Our Memory Board
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
              Smiles That Tell the <span className="text-brand-600 font-serif italic font-normal">Whole Story</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Snapshots from our daily lessons — real breakthroughs, warm high-fives, and proud smiles.
            </p>
          </div>
        </ScrollReveal>

        {/* Scattered Polaroids Layout with Staggered ScrollReveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 pt-4">
          {polaroids.map((item, idx) => (
            <ScrollReveal
              key={idx}
              animation="scale-up"
              delay={item.delay}
              className="h-full"
            >
              <div
                className={`relative bg-white p-3.5 pb-5 rounded-2xl shadow-xl shadow-brand-950/5 border border-brand-100 transform ${item.rotation} transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:z-20 group cursor-default h-full flex flex-col justify-between`}
              >
                {/* Washi Tape Accent */}
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 ${item.tapeColor} backdrop-blur-sm transform ${item.tapeRotate} rounded-sm shadow-sm opacity-90 pointer-events-none`}
                />

                {/* Photo Area */}
                <div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-100">
                    <Image
                      src={item.image}
                      alt={item.caption}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Caption */}
                  <div className="px-1">
                    <p className="font-serif italic text-slate-900 text-sm sm:text-[15px] leading-snug mb-1 font-semibold">
                      {item.caption}
                    </p>
                  </div>
                </div>

                <div className="px-1 pt-2">
                  <p className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                    {item.subtext}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Large Big Wave Transition into ParentStories (Deep Navy Ocean) */}
      <div className="absolute -bottom-[1px] left-0 right-0 pointer-events-none leading-none z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-24 md:h-32 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,45 C360,115 720,0 1080,80 C1260,105 1380,60 1440,45 L1440,120 L0,120 Z"
            fill="#061a29"
          />
        </svg>
      </div>
    </section>
  );
}
