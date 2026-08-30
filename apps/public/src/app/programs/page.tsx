import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Droplets,
  Star,
  Award,
  ArrowRight,
  Clock,
  Users,
  Target,
  Waves,
  Zap,
  Trophy,
  CheckCircle2,
  Sparkles,
  Flame,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Programs & Curriculum — Swan Swim School",
  description:
    "From toddler water discovery to competitive stroke mastery, explore our certified swim programs in Markham & Newmarket.",
};

const programs = [
  {
    title: "Parent & Tot",
    age: "Ages 6 months – 3 years",
    duration: "30 min",
    ratio: "Parent in water",
    icon: Droplets,
    gradient: "from-teal-400 to-teal-500",
    bgLight: "bg-teal-50",
    textColor: "text-teal-600",
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80",
    description:
      "A gentle, joyful introduction to the water with a parent. In our warm 90°F pool, babies and toddlers build water comfort, safety reflexes, and bonding through songs and guided water play.",
    skills: [
      "Water comfort & gentle submersions",
      "Breath control & bubble blowing",
      "Back float comfort with support",
      "Parent water-safety hold techniques",
    ],
  },
  {
    title: "Preschool Swimmers",
    age: "Ages 3 – 5",
    duration: "30 min",
    ratio: "3:1 Student-to-Coach",
    icon: Star,
    gradient: "from-warm-400 to-warm-500",
    bgLight: "bg-warm-50",
    textColor: "text-warm-500",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=700&q=80",
    description:
      "Building independent water confidence and fundamental swim skills in a nurturing environment. Our ultra-small 3:1 ratio ensures continuous attention and steady encouragement.",
    skills: [
      "Independent safe water entry & exit",
      "Unaided front & back floating",
      "Flutter kicks with kickboard",
      "Introductory arm recovery & paddle strokes",
    ],
  },
  {
    title: "Skill Builders (Youth)",
    age: "Ages 6 – 10",
    duration: "30–45 min",
    ratio: "4:1 Student-to-Coach",
    icon: Target,
    gradient: "from-brand-400 to-brand-500",
    bgLight: "bg-brand-50",
    textColor: "text-brand-600",
    image:
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=700&q=80",
    description:
      "A structured, milestone-based curriculum where students master stroke biomechanics, rotary breathing, and endurance. Every milestone is tracked and parents receive detailed report cards.",
    skills: [
      "Freestyle with bilateral side breathing",
      "Backstroke body rotation & kick power",
      "Breaststroke kick & arm timing",
      "Treading water & deep-water survival",
    ],
  },
  {
    title: "Advanced Swimmers",
    age: "Ages 10+",
    duration: "45 min",
    ratio: "6:1 Student-to-Coach",
    icon: Waves,
    gradient: "from-brand-500 to-brand-600",
    bgLight: "bg-brand-50",
    textColor: "text-brand-700",
    image:
      "https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=700&q=80",
    description:
      "Refining all four competitive strokes with emphasis on efficiency, speed, and endurance conditioning. Ideal for swimmers looking to join school teams or maintain aquatic fitness.",
    skills: [
      "Mastery of all 4 competitive strokes (Fly, Back, Breast, Free)",
      "Flip turns, open turns & legal touch finishes",
      "Pacing & interval training sets",
      "Aerobic capacity & technique consistency",
    ],
  },
  {
    title: "Private & Semi-Private Lessons",
    age: "All Ages & Abilities",
    duration: "30 min",
    ratio: "1:1 or 2:1 Custom",
    icon: Zap,
    gradient: "from-brand-600 to-brand-700",
    bgLight: "bg-brand-50",
    textColor: "text-brand-700",
    image:
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=700&q=80",
    description:
      "100% personalized one-on-one coaching customized to your exact goals. Ideal for fast-tracking progression, conquering water anxiety, or mastering specific technique breakthroughs.",
    skills: [
      "Personalized pace tailored to the student",
      "Focused 1-on-1 coach feedback",
      "Flexible schedule coordination",
      "Accelerated milestone achievement",
    ],
  },
  {
    title: "Competitive Prep (Swan Swim Team)",
    age: "Ages 8+",
    duration: "60 min",
    ratio: "6:1 Coach-to-Swimmer",
    icon: Trophy,
    gradient: "from-slate-700 to-slate-800",
    bgLight: "bg-slate-50",
    textColor: "text-slate-700",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=700&q=80",
    description:
      "For swimmers aiming for competitive racing and high-performance development. Coached by former national and collegiate swimmers focused on race strategy, starts, and time trials.",
    skills: [
      "Block starts, streamlined entry & breakout kicks",
      "Individual Medley (IM) transitions",
      "Dryland conditioning & core mobility",
      "Mental race readiness & split pacing",
    ],
  },
];

export default function ProgramsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path
              d="M0,32 C480,80 960,0 1440,32 L1440,80 L0,80 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="section-container relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-semibold mb-6 border border-white/20">
            <Waves size={16} />
            Milestone-Based Aquatic Education
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Our Swimming Programs
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From first toddler splashes in our 90°F warm pool to competitive racing readiness,
            find the perfect program for your child.
          </p>
        </div>
      </section>

      {/* Programs List */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="space-y-12">
            {programs.map((program) => (
              <div
                key={program.title}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group"
              >
                {/* Visual Image Header / Column */}
                <div className="relative h-64 lg:h-auto lg:w-2/5 shrink-0 bg-slate-100 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-950/20" />
                  
                  {/* Floating Age Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold uppercase tracking-wider shadow-md">
                      {program.age}
                    </span>
                  </div>

                  {/* Program Icon & Name on Mobile */}
                  <div className="absolute bottom-4 left-4 right-4 lg:hidden text-white">
                    <h2 className="font-display font-bold text-2xl text-white">
                      {program.title}
                    </h2>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-8 sm:p-10 lg:w-3/5 flex flex-col justify-between">
                  <div>
                    {/* Desktop Title & Meta */}
                    <div className="hidden lg:flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${program.gradient} flex items-center justify-center text-white shrink-0`}
                        >
                          <program.icon size={22} />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-2xl text-slate-900">
                            {program.title}
                          </h2>
                          <span className={`text-xs font-bold uppercase tracking-wider ${program.textColor}`}>
                            {program.age}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                          <Clock size={13} /> {program.duration}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                          <Users size={13} /> {program.ratio}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">
                      {program.description}
                    </p>

                    {/* What They'll Learn */}
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 mb-6">
                      <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">
                        Key Skills & Milestones
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {program.skills.map((skill) => (
                          <div
                            key={skill}
                            className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-medium"
                          >
                            <CheckCircle2
                              size={16}
                              className="text-teal-600 shrink-0 mt-0.5"
                            />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Flame size={14} className="text-amber-500" />
                      <span>Heated 90°F Water • Report Cards Included</span>
                    </div>

                    <Link
                      href="/trial"
                      className="btn-primary !py-2.5 !px-6 !text-sm !rounded-xl w-full sm:w-auto font-bold group"
                    >
                      Book Free Trial
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-50">
        <div className="section-container text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={16} />
            Unsure of Placement?
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Let Us Assess Your Child in Person
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto mb-8">
            During your complimentary 30-minute trial class, our lead instructors will assess
            your child and recommend the ideal placement.
          </p>
          <Link href="/trial" className="btn-primary !py-4 !px-8 !text-lg !rounded-2xl group font-bold">
            Book a Free Trial Class
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </>
  );
}
