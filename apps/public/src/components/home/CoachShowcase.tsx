import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, Heart, ArrowRight, Users } from "lucide-react";

interface CoachCardProps {
  initials: string;
  bgColor: string;
  name: string;
  role: string;
  experience: string;
  specialty: string;
  certifications: string[];
  quote: string;
}

function CoachCard({ initials, bgColor, name, role, experience, specialty, certifications, quote }: CoachCardProps) {
  return (
    <div className="bg-slate-50/70 rounded-3xl border border-slate-100 p-6 sm:p-7 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Avatar + Experience Badge */}
        <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-6 flex items-center justify-center" style={{ background: bgColor }}>
          <span className="text-white font-bold text-6xl font-display select-none">{initials}</span>
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
              {experience}
            </span>
          </div>
        </div>

        {/* Name and Role */}
        <h3 className="font-display font-bold text-xl text-slate-900 mb-1">{name}</h3>
        <p className="text-brand-600 font-semibold text-sm mb-3">{role}</p>

        {/* Specialty */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200/80 text-slate-700 text-xs font-medium mb-4">
          <Heart size={14} className="text-rose-500 shrink-0" />
          <span>{specialty}</span>
        </div>

        {/* Quote */}
        <p className="text-slate-600 text-sm italic leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
      </div>

      {/* Certifications */}
      <div className="pt-4 border-t border-slate-200/70 space-y-1.5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Certifications</div>
        {certifications.map((cert) => (
          <div key={cert} className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck size={14} className="text-teal-600 shrink-0" />
            <span>{cert}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
              <Award size={16} />
              The People Behind Swan
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
              Led by coaches who{" "}
              <span className="gradient-text">genuinely care</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
              Every Swan instructor holds national lifesaving certifications, passes a full background
              check, and is trained to teach at your child&apos;s pace — not the class&apos;s pace.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors shrink-0 text-sm sm:text-base group"
          >
            More about us <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Coaches Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Mo — named in real Google reviews */}
          <CoachCard
            initials="Mo"
            bgColor="linear-gradient(135deg, #0e6fa5 0%, #0b4f78 100%)"
            name="Coach Mo"
            role="Co-Founder & Lead Instructor"
            experience="Swim School Founder"
            specialty="Student Progress & Program Development"
            certifications={[
              "Lifesaving Society WSI Certified",
              "Standard First Aid / CPR-C",
              "Background Checked & Cleared",
            ]}
            quote="We track every student personally. No child gets overlooked — that's a promise, not a policy."
          />

          {/* Farhad — named in real Google reviews */}
          <CoachCard
            initials="Fa"
            bgColor="linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
            name="Coach Farhad"
            role="Co-Founder & Senior Coach"
            experience="Swim School Founder"
            specialty="Individualized Pacing & Skill Assessment"
            certifications={[
              "Lifesaving Society WSI Certified",
              "Standard First Aid / CPR-C",
              "Background Checked & Cleared",
            ]}
            quote="A flexible teaching model isn't a nice-to-have — it's the reason kids actually improve."
          />

          {/* Generic "Our Team" card — honest placeholder until real instructor profiles provided */}
          <div className="bg-gradient-to-br from-brand-50 to-teal-50/50 rounded-3xl border border-brand-100 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div
                className="relative h-48 w-full rounded-2xl overflow-hidden mb-6 flex items-center justify-center bg-gradient-to-br from-brand-100 to-teal-100"
              >
                <Users size={64} className="text-brand-400" />
              </div>

              <h3 className="font-display font-bold text-xl text-slate-900 mb-1">Our Instructor Team</h3>
              <p className="text-brand-600 font-semibold text-sm mb-3">Markham & Newmarket Locations</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-brand-100 text-slate-700 text-xs font-medium mb-4">
                <Heart size={14} className="text-rose-500 shrink-0" />
                <span>All Ages & All Levels</span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Every instructor on our team is Lifesaving Society or Red Cross certified,
                background-checked, and selected for patience as much as skill.
                We don&apos;t just hire coaches — we hire people who love working with kids.
              </p>
            </div>

            <div className="pt-4 border-t border-brand-100 space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Team Standards</div>
              {[
                "Lifesaving Society / Red Cross WSI",
                "CPR-C & Standard First Aid",
                "Full Background Verification",
              ].map((cert) => (
                <div key={cert} className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
