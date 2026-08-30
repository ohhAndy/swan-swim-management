import React from "react";
import Image from "next/image";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { ScrollReveal } from "@/components/common/ScrollReveal";

export function ParentStories() {
  const googleLocations = {
    markham: "https://search.google.com/local/reviews?placeid=ChIJlyPXYQzV1IkRA3M31LwI3uI",
    newmarket: "https://share.google/IQZh40Y1ztA9Z1Abp",
  };

  const realGoogleReviews = [
    {
      quote:
        "I wish we knew of this swim school years ago! In just 6 weeks, I have seen a drastic improvement in my child's swimming abilities. The instructors are fantastic and keep the students motivated. Mo and Farhad oversee the instruction and students' progress to ensure they reach their potential. My child looks forward to lessons every week.",
      author: "Amy Ma",
      location: "Markham Branch",
      // Direct Google search link that highlights Amy Ma's exact review
      googleReviewUrl:
        'https://www.google.com/search?q=Swan+swim+school+Markham+"I+wish+we+knew+of+this+swim+school+years+ago"',
      avatar:
        "https://lh3.googleusercontent.com/a-/ACB-R5TgnlfWm5I1PVw8ktIo4Gv51QWJqpFlgQ7cnqozpA=s128-c0x00000000-cc-rp-mo",
      delay: 0,
    },
    {
      quote:
        "My 3 and 6 years old started swimming lessons with Swan three months ago. I'm thankful for the instructors' patience in guiding them to overcome the initial fear. My kids have built a friendship with them and looked forward to the weekly lesson. The small ratio allowed for a more individualized and effective learning experience.",
      author: "Janice Y. Ngai",
      location: "Markham & Newmarket",
      // Direct Google search link that highlights Janice Ngai's exact review
      googleReviewUrl:
        'https://www.google.com/search?q=Swan+swim+school+Markham+"My+3+and+6+years+old+started+swimming+lessons+with+Swan"',
      avatar:
        "https://lh3.googleusercontent.com/a-/ACB-R5QHa0AOHBewewUEbmMk726TTaGeCWNFaav5F9ddlA=s128-c0x00000000-cc-rp-mo",
      delay: 150,
    },
    {
      quote:
        "Mo and Farhad are the best coaches. My kid 6yrs has been with Swan Swim school for the past one year and he is able to swim across the pool gracefully now. They have a flexible teaching model which focuses on individual pace and skill. A wonderful addition to this experience is having excellent make up classes so we don't have to worry about vacations.",
      author: "Akshaya Karthikeyan",
      location: "Markham Branch",
      // Direct Google search link that highlights Akshaya's exact review
      googleReviewUrl:
        'https://www.google.com/search?q=Swan+swim+school+Markham+"Mo+and+Farhad+are+the+best+coaches"',
      avatar:
        "https://lh3.googleusercontent.com/a/AGNmyxYnVnI52kSXwBF_0gYBXlw3__uOJ38DHn4P5kPw=s128-c0x00000000-cc-rp-mo",
      delay: 300,
    },
  ];

  return (
    <section className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 bg-gradient-to-br from-[#061a29] via-brand-950 to-brand-900 text-white overflow-hidden">
      {/* Ambient glowing pools */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Header with Official Google Badge */}
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>4.9 ★★★★★ on Google Reviews (350+ Reviews)</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold !text-white mb-4 tracking-tight">
              Stories from <span className="text-amber-300 font-serif italic font-normal">Proud Parents</span>
            </h2>
            <p className="text-slate-200 text-base sm:text-lg mb-6">
              Real families, real words — click any card to verify the review on Google.
            </p>

            {/* Direct Google Maps Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <a
                href={googleLocations.markham}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white font-semibold group shadow-sm hover:scale-105"
              >
                <MapPin size={14} className="text-amber-300" />
                <span>Markham Google Reviews (198+)</span>
                <ExternalLink size={13} className="text-slate-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href={googleLocations.newmarket}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white font-semibold group shadow-sm hover:scale-105"
              >
                <MapPin size={14} className="text-teal-300" />
                <span>Newmarket Google Reviews</span>
                <ExternalLink size={13} className="text-slate-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Stories Grid with Staggered ScrollReveal — Each Card links directly to that specific Google review */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {realGoogleReviews.map((story) => (
            <ScrollReveal
              key={story.author}
              animation="fade-up"
              delay={story.delay}
              className="h-full"
            >
              <a
                href={story.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/15 shadow-2xl hover:border-teal-400/50 hover:bg-white/[0.14] transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer hover:-translate-y-1 block relative"
              >
                <div>
                  {/* 5 Stars & Google Verified Tag */}
                  <div className="flex items-center justify-between gap-1 mb-6">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-amber-400" />
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 group-hover:text-amber-300 transition-colors">
                      <span>View on Google</span>
                      <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  <p className="text-slate-100 leading-relaxed text-sm sm:text-base mb-8 font-normal">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-700 border-2 border-white/40 shadow-xs group-hover:border-teal-300 transition-colors">
                    <Image
                      src={story.avatar}
                      alt={story.author}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="font-bold !text-white text-sm group-hover:text-amber-300 transition-colors">
                      {story.author}
                    </div>
                    <div className="text-slate-300 text-xs font-medium">
                      Verified Google Reviewer
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-teal-300 font-bold mt-0.5">
                      <MapPin size={11} /> {story.location}
                    </div>
                  </div>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Large Big Wave Transition into CTA Banner */}
      <div className="absolute -bottom-[1px] left-0 right-0 pointer-events-none leading-none z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-24 md:h-32 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C420,120 840,-10 1260,80 C1320,95 1380,70 1440,55 L1440,120 L0,120 Z"
            fill="#11527e"
          />
        </svg>
      </div>
    </section>
  );
}
