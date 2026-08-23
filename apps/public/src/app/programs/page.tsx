import type { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Programs — Swan Swim School",
  description:
    "From water introduction for toddlers to competitive training, discover the perfect swim program for your child at Swan Swim School.",
};

const programs = [
  {
    title: "Parent & Tot",
    age: "Ages 6 months – 3 years",
    duration: "30 min",
    ratio: "N/A (parent in water)",
    icon: Droplets,
    gradient: "from-teal-400 to-teal-500",
    bgLight: "bg-teal-50",
    textColor: "text-teal-600",
    description:
      "A gentle introduction to the water for babies and toddlers with a parent by their side. Build water comfort, basic safety awareness, and bonding through songs, games, and guided activities.",
    skills: [
      "Water comfort & acclimatization",
      "Breath control basics",
      "Floating with support",
      "Parent safety techniques",
    ],
  },
  {
    title: "Preschool Swimmers",
    age: "Ages 3 – 5",
    duration: "30 min",
    ratio: "3:1 student-to-instructor",
    icon: Star,
    gradient: "from-warm-400 to-warm-500",
    bgLight: "bg-warm-50",
    textColor: "text-warm-500",
    description:
      "Building water confidence and fundamental swim skills in a fun, nurturing environment. Our small 3:1 ratios mean every child gets the attention they need to progress at their own pace.",
    skills: [
      "Independent water entry & exit",
      "Front & back float",
      "Kick & glide technique",
      "Basic stroke introduction",
    ],
  },
  {
    title: "Skill Builders",
    age: "Ages 6 – 10",
    duration: "30–45 min",
    ratio: "4:1 student-to-instructor",
    icon: Target,
    gradient: "from-brand-400 to-brand-500",
    bgLight: "bg-brand-50",
    textColor: "text-brand-600",
    description:
      "A structured, level-based program where students build stroke technique, endurance, and water safety skills. Each level has clear benchmarks so you can track your child's progress.",
    skills: [
      "Freestyle & backstroke technique",
      "Breaststroke & butterfly introduction",
      "Treading water & deep-water safety",
      "Endurance building",
    ],
  },
  {
    title: "Advanced Swimmers",
    age: "Ages 10+",
    duration: "45 min",
    ratio: "6:1 student-to-instructor",
    icon: Waves,
    gradient: "from-brand-500 to-brand-600",
    bgLight: "bg-brand-50",
    textColor: "text-brand-700",
    description:
      "Refining all four competitive strokes with a focus on technique, efficiency, and race readiness. Ideal for swimmers looking to join a swim team or improve their times.",
    skills: [
      "All four competitive strokes",
      "Flip turns & dive starts",
      "Interval training",
      "Race strategy & pacing",
    ],
  },
  {
    title: "Private Lessons",
    age: "All ages",
    duration: "30 min",
    ratio: "1:1 or 2:1",
    icon: Zap,
    gradient: "from-brand-600 to-brand-700",
    bgLight: "bg-brand-50",
    textColor: "text-brand-700",
    description:
      "Personalized one-on-one instruction tailored to your specific goals. Perfect for beginners who need extra comfort, or experienced swimmers working on specific techniques.",
    skills: [
      "Customized lesson plan",
      "Flexible scheduling",
      "Accelerated progress",
      "Any age or skill level",
    ],
  },
  {
    title: "Competitive Prep",
    age: "Ages 8+",
    duration: "60 min",
    ratio: "6:1 student-to-instructor",
    icon: Trophy,
    gradient: "from-slate-700 to-slate-800",
    bgLight: "bg-slate-50",
    textColor: "text-slate-700",
    description:
      "For swimmers ready to compete. Focus on race-ready technique, endurance sets, and mental preparation. Our coaches have competitive swimming backgrounds and know what it takes.",
    skills: [
      "Competition-level stroke refinement",
      "Starts, turns & finishes",
      "Conditioning & dryland exercises",
      "Meet preparation & strategy",
    ],
  },
];

export default function ProgramsPage() {
  return (
    <>
      {/* Hero */}
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
            <Waves size={16} />
            Find Your Level
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Our Programs
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            From first splashes to competitive racing — we have a program designed
            for every age and skill level.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="space-y-12">
            {programs.map((program, index) => (
              <div
                key={program.title}
                className={`glass-card overflow-hidden hover:shadow-xl transition-shadow ${
                  index % 2 === 0 ? "" : ""
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${program.gradient}`} />
                <div className="p-8 sm:p-10 lg:p-12">
                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Main info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-4 mb-6">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${program.gradient} flex items-center justify-center shrink-0`}
                        >
                          <program.icon size={24} className="text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-2xl text-slate-900">
                            {program.title}
                          </h2>
                          <span className={`text-sm font-semibold ${program.textColor}`}>
                            {program.age}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 leading-relaxed mb-6">
                        {program.description}
                      </p>

                      {/* Meta pills */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${program.bgLight} rounded-lg text-sm font-medium ${program.textColor}`}>
                          <Clock size={14} />
                          {program.duration}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${program.bgLight} rounded-lg text-sm font-medium ${program.textColor}`}>
                          <Users size={14} />
                          {program.ratio}
                        </div>
                      </div>
                    </div>

                    {/* Right: Skills */}
                    <div className="lg:border-l lg:border-slate-100 lg:pl-8">
                      <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-4">
                        What They&apos;ll Learn
                      </h3>
                      <ul className="space-y-3">
                        {program.skills.map((skill) => (
                          <li
                            key={skill}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-br ${program.gradient} flex items-center justify-center shrink-0 mt-0.5`}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M2 5L4 7L8 3"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Not Sure Which Program Is Right?
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
            Book a free trial and our team will help place your child in the
            perfect program for their age and skill level.
          </p>
          <Link href="/trial" className="btn-primary !py-4 !px-8 !text-lg group">
            Book a Free Trial
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
