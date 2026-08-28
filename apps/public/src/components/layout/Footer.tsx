import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer */}
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/swanSwimLogo.png"
                alt="Swan Swim School"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="font-display font-bold text-xl text-white">
                Swan Swim School
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Building confidence in the water, one stroke at a time. Expert
              instruction in a safe, nurturing environment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-base">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/programs", label: "Programs" },
                { href: "/trial", label: "Book a Trial" },
                { href: "/about", label: "About Us" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact & Locations" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-brand-300 transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-base">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:2897639339"
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-brand-400 shrink-0" />
                  <span>(289) 763-9339</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@swanswimschool.com"
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Mail size={16} className="text-brand-400 shrink-0" />
                  <span>info@swanswimschool.com</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin size={16} className="text-brand-400 mt-0.5 shrink-0" />
                <span>Newmarket &bull; Markham &bull; Angus Glen</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="section-container py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Swan Swim School. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/terms"
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
