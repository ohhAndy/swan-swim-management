import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Droplets,
  Users,
  Award,
  Shield,
  Star,
  Heart,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden pt-28 pb-36 md:pt-32 md:pb-44 lg:pt-36 lg:pb-48">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800" />

        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-300/10 rounded-full blur-3xl pointer-events-none" />

        {/* Wave pattern bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 leading-none">
          <svg
            viewBox="0 0 1440 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-14 sm:h-20 md:h-24 block"
            preserveAspectRatio="none"
          >
            <path
              d="M0,36 C320,84 680,8 1040,48 C1220,68 1360,54 1440,44 L1440,96 L0,96 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="section-container relative z-20 w-full my-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6 animate-fade-in-up animate-on-load">
                <Droplets size={16} />
                Now Enrolling for the Upcoming Term
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up animate-on-load delay-100">
                Where Every Child{" "}
                <span className="relative">
                  <span className="relative z-10">Learns to Swim</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-warm-400/30 rounded-sm -z-0" />
                </span>{" "}
                with Confidence
              </h1>

              <p className="text-lg sm:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-in-up animate-on-load delay-200">
                Expert instruction, small class ratios, and a safe, nurturing
                environment. From first splashes to competitive strokes —
                we&apos;re with your child every stroke of the way.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animate-on-load delay-300">
                <Link
                  href="/trial"
                  className="btn-primary !py-4 !px-8 !text-lg !rounded-2xl group"
                >
                  Book a Free Trial
                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/programs"
                  className="btn-secondary !py-4 !px-8 !text-lg !rounded-2xl !text-white/90 !border-white/30 hover:!bg-white/10 hover:!border-white/50"
                >
                  View Programs
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start animate-fade-in-up animate-on-load delay-400">
                {[
                  { icon: Users, label: "Small Class Ratios" },
                  { icon: Award, label: "Certified Instructors" },
                  { icon: Shield, label: "Safe Environment" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-white/70 text-sm"
                  >
                    <item.icon size={16} className="text-teal-300" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Logo / visual */}
            <div className="hidden lg:flex justify-center items-center animate-fade-in animate-on-load delay-300">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-brand-300/20 rounded-full blur-3xl scale-110" />
                <div className="relative w-80 h-80 xl:w-96 xl:h-96 animate-float">
                  <Image
                    src="/swanSwimLogo.png"
                    alt="Swan Swim School Logo"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROGRAMS PREVIEW ============ */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-500 font-semibold text-sm tracking-widest uppercase mb-3">
              Our Programs
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Programs for <span className="gradient-text">Every Level</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              From water introduction for toddlers to advanced technique for
              competitive swimmers, we have a program designed for your child.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Little Swimmers",
                age: "Ages 3–5",
                description:
                  "Water confidence and basic skills in a fun, playful environment. Small ratios ensure every child gets individual attention.",
                color: "from-teal-400 to-teal-500",
                icon: Droplets,
              },
              {
                title: "Skill Builders",
                age: "Ages 6–10",
                description:
                  "Building stroke technique and endurance. Students progress through structured levels as they master each skill.",
                color: "from-brand-400 to-brand-500",
                icon: Star,
              },
              {
                title: "Advanced & Competitive",
                age: "Ages 10+",
                description:
                  "Refining technique, building speed, and preparing for competitive swimming. Personalized coaching for serious swimmers.",
                color: "from-brand-600 to-brand-700",
                icon: Award,
              },
            ].map((program) => (
              <div
                key={program.title}
                className="glass-card p-8 relative overflow-hidden group"
              >
                {/* Color accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${program.color}`}
                />

                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <program.icon size={24} className="text-white" />
                </div>

                <h3 className="font-display font-bold text-xl text-slate-900 mb-1">
                  {program.title}
                </h3>
                <span className="text-brand-500 text-sm font-semibold">
                  {program.age}
                </span>
                <p className="text-slate-500 mt-3 leading-relaxed text-sm">
                  {program.description}
                </p>

                <Link
                  href="/programs"
                  className="inline-flex items-center gap-1 text-brand-500 font-semibold text-sm mt-6 group-hover:gap-2 transition-all"
                >
                  Learn More <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/programs" className="btn-secondary">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* ============ WHY SWAN ============ */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-500 font-semibold text-sm tracking-widest uppercase mb-3">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Why Families <span className="gradient-text">Love Swan</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              We&apos;re not just teaching swimming — we&apos;re building
              lifelong water safety skills and confidence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Small Class Ratios",
                desc: "Maximum 3:1 student-to-instructor ratio for preschool, ensuring personalized attention.",
              },
              {
                icon: Award,
                title: "Certified Instructors",
                desc: "All instructors are certified and trained in the latest aquatic education techniques.",
              },
              {
                icon: Shield,
                title: "Safety First",
                desc: "Comprehensive safety protocols and a clean, maintained facility for your peace of mind.",
              },
              {
                icon: Heart,
                title: "Progress Tracking",
                desc: "Detailed report cards and skill assessments so you can see your child's growth.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 group-hover:scale-110 transition-all">
                  <item.icon size={28} className="text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-500 font-semibold text-sm tracking-widest uppercase mb-3">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              What <span className="gradient-text">Parents Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "My daughter was terrified of the water. After just one term at Swan, she's diving in with a huge smile. The instructors are incredible!",
                name: "Sarah M.",
                role: "Parent of Lily, age 5",
              },
              {
                quote:
                  "The small class sizes make all the difference. Our son gets so much individual attention. His technique has improved dramatically.",
                name: "David K.",
                role: "Parent of Ethan, age 8",
              },
              {
                quote:
                  "We've tried other swim schools, but Swan is on another level. The progress reports are detailed and the staff truly cares about every child.",
                name: "Maria L.",
                role: "Parent of Sofia, age 6",
              },
            ].map((t, i) => (
              <div key={i} className="glass-card p-8 relative">
                {/* Quote mark */}
                <div className="text-brand-200 text-6xl font-serif leading-none mb-4">
                  &ldquo;
                </div>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-300/10 rounded-full blur-3xl" />

        <div className="section-container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Make a Splash?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Book a free trial class and see why families love Swan Swim School.
            No commitment required — just bring a swimsuit and a smile!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/trial"
              className="btn-primary !bg-white !text-brand-700 hover:!bg-slate-50 !py-4 !px-8 !text-lg !rounded-2xl !shadow-xl group"
            >
              Book a Free Trial
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/contact"
              className="btn-secondary !text-white !border-white/30 hover:!bg-white/10 !py-4 !px-8 !text-lg !rounded-2xl"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
