import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/swanSwimLogo.png"
                alt="Swan Swim School"
                width={40}
                height={40}
                className="w-10 h-10 brightness-200"
              />
              <span className="font-display font-bold text-xl text-white">
                Swan Swim School
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Building confidence in the water, one stroke at a time.
              Expert instruction in a safe, nurturing environment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/programs", label: "Programs" },
                { href: "/trial", label: "Book a Trial" },
                { href: "/about", label: "About Us" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-brand-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Phone size={16} className="text-brand-400 mt-0.5 shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Mail size={16} className="text-brand-400 mt-0.5 shrink-0" />
                <span>info@swanswimschool.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-brand-400 mt-0.5 shrink-0" />
                <span>123 Pool Lane, Anytown, ON</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Hours
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-400">Mon - Fri</span>
                <span>3:00 PM – 8:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Saturday</span>
                <span>9:00 AM – 5:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Sunday</span>
                <span>10:00 AM – 3:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="section-container py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Swan Swim School. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
