import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, ShieldCheck, Heart, ArrowRight } from "lucide-react";

export function CoachShowcase() {
  const coaches = [
    {
      name: "Coach Marcus Chen",
      role: "Head Aquatic Director",
      experience: "12+ Years Experience",
      specialty: "Stroke Technique & Competitive Prep",
      certifications: ["NCCP Level 2 Coach", "Lifesaving Society Examiner", "Standard First Aid / CPR-C"],
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      quote:
        "Swimming isn't just a physical skill — it's confidence that transforms how children approach challenges in life.",
    },
    {
      name: "Coach Elena Rodriguez",
      role: "Lead Preschool Instructor",
      experience: "8+ Years Experience",
      specialty: "Toddler Acclimatization & Gentle Water Comfort",
      certifications: ["Red Cross WSI Certified", "Early Childhood Aquatic Specialist", "CPR-C / AED"],
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
      quote:
        "My goal is to make every child feel safe and celebrated from their very first breath in the pool.",
    },
    {
      name: "Coach Liam Davies",
      role: "Senior Youth Coach",
      experience: "6+ Years Experience",
      specialty: "Freestyle & Butterfly Biomechanics",
      certifications: ["Swim Ontario Certified", "Lifesaving Instructor", "National Lifeguard (NL)"],
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      quote:
        "Small adjustments in posture and kick timing unlock massive breakthroughs in speed and endurance.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
              <Award size={16} />
              Expert Leadership
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
              Learn from <span className="gradient-text">Certified, Caring Coaches</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
              All Swan instructors undergo rigorous background checks, continuous aquatic education,
              and hold national lifesaving certifications.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors shrink-0 text-sm sm:text-base group"
          >
            Meet our entire team <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Coaches Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {coaches.map((coach) => (
            <div
              key={coach.name}
              className="bg-slate-50/70 rounded-3xl border border-slate-100 p-6 sm:p-7 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Image + Experience Badge */}
                <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-6 bg-slate-200">
                  <Image
                    src={coach.image}
                    alt={coach.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                      {coach.experience}
                    </span>
                  </div>
                </div>

                {/* Name and Role */}
                <h3 className="font-display font-bold text-xl text-slate-900 mb-1">
                  {coach.name}
                </h3>
                <p className="text-brand-600 font-semibold text-sm mb-3">
                  {coach.role}
                </p>

                {/* Specialty */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200/80 text-slate-700 text-xs font-medium mb-4">
                  <Heart size={14} className="text-rose-500 shrink-0" />
                  <span>{coach.specialty}</span>
                </div>

                {/* Quote */}
                <p className="text-slate-600 text-sm italic leading-relaxed mb-6">
                  &ldquo;{coach.quote}&rdquo;
                </p>
              </div>

              {/* Certifications List */}
              <div className="pt-4 border-t border-slate-200/70 space-y-1.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Certifications
                </div>
                {coach.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
