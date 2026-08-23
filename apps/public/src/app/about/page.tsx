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
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Swan Swim School",
  description:
    "Learn about Swan Swim School's mission, our experienced team, and why families trust us with their children's swim education.",
};

export default function AboutPage() {
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
            <Heart size={16} />
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            About Swan Swim School
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Building confidence in the water, one stroke at a time.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-brand-500 font-semibold text-sm tracking-widest uppercase mb-3">
                Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Every Child Deserves to{" "}
                <span className="gradient-text">Feel Safe</span> in the Water
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Swan Swim School was founded with a simple belief: every child should
                  have the opportunity to learn water safety and swimming in a nurturing,
                  professional environment.
                </p>
                <p>
                  Our program is built on progressive skill development — from the very
                  first splash to competitive racing. We keep our class sizes small because
                  we believe that personalized attention is the fastest path to confidence
                  and competence.
                </p>
                <p>
                  We&apos;re proud to be a trusted part of our community, helping hundreds
                  of families build lifelong water safety skills.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center overflow-hidden">
                <Image
                  src="/swanSwimLogo.png"
                  alt="Swan Swim School"
                  width={300}
                  height={300}
                  className="object-contain"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-100 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand-100 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-500 font-semibold text-sm tracking-widest uppercase mb-3">
              Our Values
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What <span className="gradient-text">Drives Us</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Safety Above All",
                desc: "Comprehensive safety protocols, certified instructors, and maintained facilities ensure your child is always in safe hands.",
              },
              {
                icon: Users,
                title: "Individual Attention",
                desc: "Small class ratios mean every child gets the personalized instruction they need to progress at their own pace.",
              },
              {
                icon: Target,
                title: "Progressive Learning",
                desc: "Our structured level system provides clear benchmarks and measurable progress for every student.",
              },
              {
                icon: Heart,
                title: "Nurturing Environment",
                desc: "We create a positive, encouraging atmosphere where children feel comfortable taking on new challenges.",
              },
              {
                icon: Award,
                title: "Excellence in Teaching",
                desc: "Our instructors are trained, certified, and passionate about helping children develop a love for swimming.",
              },
              {
                icon: Waves,
                title: "Lifelong Skills",
                desc: "We're not just teaching swimming — we're building water safety awareness that lasts a lifetime.",
              },
            ].map((value) => (
              <div key={value.title} className="glass-card p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <value.icon size={24} className="text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Come See for Yourself
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
            The best way to experience Swan Swim School is with a free trial class.
            We&apos;d love to meet your family!
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
