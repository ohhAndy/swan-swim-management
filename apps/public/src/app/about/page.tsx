import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  Heart,
  Shield,
  Users,
  Target,
  Waves,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { CoachShowcase } from "@/components/home/CoachShowcase";

export const metadata: Metadata = {
  title: "About Us — Swan Swim School",
  description:
    "Learn about Swan Swim School's mission, our certified coaching team, and why families across York Region trust us.",
};

export default function AboutPage() {
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
            <Heart size={16} />
            Our Mission & Story
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Nurturing Confident, Safe Swimmers
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Building lifelong water safety skills and joy in the water, one stroke at a time.
          </p>
        </div>
      </section>

      {/* Mission & Story with Photos */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={16} />
                Our Philosophy
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Every Child Deserves to <span className="gradient-text">Feel Safe & Celebrated</span>
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed text-base">
                <p>
                  Swan Swim School was founded on a simple belief: swimming is a vital life skill
                  best learned through patience, small ratios, and a warm, supportive environment.
                </p>
                <p>
                  Many children struggle in traditional large-group swim lessons due to cold pool water,
                  crowded lanes, and noisy environments. We redesigned the swim lesson experience from the
                  ground up — maintaining our teaching pools at a comfortable 90°F, capping class ratios
                  at 3:1 for young learners, and utilizing certified, compassionate instructors.
                </p>
                <p>
                  Today, we are honored to serve over 1,500 families across Markham and Newmarket,
                  guiding students from their very first splashes to competitive racing readiness.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">90°F Warm Water</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Tear-free comfort for infants & young kids</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">3:1 Max Ratio</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Personal attention every minute of class</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative bg-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80"
                  alt="Swim coach guiding young student at Swan Swim School"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Floating review card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl border border-slate-100 max-w-xs hidden sm:block">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-400">★★★★★</div>
                  <span className="text-xs font-bold text-slate-800">4.9 / 5 Rating</span>
                </div>
                <p className="text-slate-600 text-xs italic">
                  &ldquo;The best decision we made for our daughter. Gentle, encouraging, and highly effective.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
              <Shield size={16} />
              Our Core Pillars
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What <span className="gradient-text">Sets Us Apart</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Safety Above All",
                desc: "Comprehensive safety protocols, certified lifeguards on deck, and secondary UV water purification.",
              },
              {
                icon: Users,
                title: "Individual Attention",
                desc: "Small class ratios ensure every swimmer receives customized coaching and active engagement.",
              },
              {
                icon: Target,
                title: "Progressive Curriculum",
                desc: "Clear benchmarks, continuous assessment, and celebratory ribbons make milestones rewarding.",
              },
              {
                icon: Heart,
                title: "Nurturing Environment",
                desc: "We build confidence through positive reinforcement, celebrating effort alongside mastery.",
              },
              {
                icon: Award,
                title: "Excellence in Coaching",
                desc: "Our instructors are nationally certified with extensive competitive and teaching backgrounds.",
              },
              {
                icon: Waves,
                title: "Lifelong Water Safety",
                desc: "Instilling deep-water survival reflexes and stroke efficiency that will protect them for a lifetime.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-white transition-all text-brand-600">
                  <value.icon size={26} />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Team Showcase */}
      <CoachShowcase />

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Come Experience the Swan Difference
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Book a complimentary trial lesson and see our warm pool and caring instructors in action.
          </p>
          <Link href="/trial" className="btn-primary !py-4 !px-8 !text-lg !rounded-2xl group font-bold">
            Book a Free Trial Lesson
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
