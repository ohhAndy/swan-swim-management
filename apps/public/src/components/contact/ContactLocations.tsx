"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  ArrowRight,
  Waves,
  Car,
  Wifi,
  Sparkles,
} from "lucide-react";

export interface LocationInfo {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  hours: { day: string; hours: string }[];
  features: string[];
  poolDetails: {
    temp: string;
    length: string;
    type: string;
  };
}

export const LOCATIONS: LocationInfo[] = [
  {
    id: "markham",
    name: "Markham",
    badge: "Flagship Location",
    tagline: "Main Campus & Olympic-Standard Heated Facility",
    address: "100 Town Centre Blvd",
    city: "Markham",
    province: "ON",
    postalCode: "L3R 9W3",
    phone: "(905) 555-0142",
    email: "markham@swanswimschool.com",
    features: [
      "Dedicated 25m heated saltwater pool (88°F / 31°C)",
      "Viewing gallery with high-speed guest Wi-Fi",
      "Private family changing suites & lockers",
      "Spacious free on-site parking lot",
    ],
    poolDetails: {
      temp: "88°F (31°C)",
      length: "25m 4-Lane",
      type: "Saltwater Purified",
    },
    hours: [
      { day: "Monday", hours: "3:00 PM – 8:30 PM" },
      { day: "Tuesday", hours: "3:00 PM – 8:30 PM" },
      { day: "Wednesday", hours: "3:00 PM – 8:30 PM" },
      { day: "Thursday", hours: "3:00 PM – 8:30 PM" },
      { day: "Friday", hours: "3:00 PM – 8:00 PM" },
      { day: "Saturday", hours: "8:30 AM – 5:30 PM" },
      { day: "Sunday", hours: "9:00 AM – 4:00 PM" },
    ],
  },
  {
    id: "newmarket",
    name: "Newmarket",
    badge: "York Region Campus",
    tagline: "Modern Aquatic Center & Family Facility",
    address: "17215 Lesile St",
    city: "Newmarket",
    province: "ON",
    postalCode: "L3Y 4Z1",
    phone: "(905) 555-0188",
    email: "newmarket@swanswimschool.com",
    features: [
      "Warm therapeutic water temperature (90°F / 32°C)",
      "Acoustic-dampened parent viewing area",
      "Individual toddler & infant wash stations",
      "Direct transit access & ample plaza parking",
    ],
    poolDetails: {
      temp: "90°F (32°C)",
      length: "20m 3-Lane",
      type: "UV & Salt Filtered",
    },
    hours: [
      { day: "Monday", hours: "3:30 PM – 8:00 PM" },
      { day: "Tuesday", hours: "3:30 PM – 8:00 PM" },
      { day: "Wednesday", hours: "3:30 PM – 8:00 PM" },
      { day: "Thursday", hours: "3:30 PM – 8:00 PM" },
      { day: "Friday", hours: "3:30 PM – 7:30 PM" },
      { day: "Saturday", hours: "9:00 AM – 5:00 PM" },
      { day: "Sunday", hours: "9:00 AM – 3:30 PM" },
    ],
  },
  {
    id: "richmond-hill",
    name: "Richmond Hill",
    badge: "New Location",
    tagline: "State-of-the-Art Training & Stroke Clinic Facility",
    address: "10268 Yonge St",
    city: "Richmond Hill",
    province: "ON",
    postalCode: "L4C 3B7",
    phone: "(905) 555-0199",
    email: "richmondhill@swanswimschool.com",
    features: [
      "Dual teaching & deep-water skill zones",
      "Glass-enclosed observation deck",
      "Accessible ADA compliant pool entry ramps",
      "Convenient curbside drop-off loop",
    ],
    poolDetails: {
      temp: "89°F (31.5°C)",
      length: "25m 4-Lane",
      type: "Ozone Salt Purified",
    },
    hours: [
      { day: "Monday", hours: "3:00 PM – 8:00 PM" },
      { day: "Tuesday", hours: "3:00 PM – 8:00 PM" },
      { day: "Wednesday", hours: "3:00 PM – 8:00 PM" },
      { day: "Thursday", hours: "3:00 PM – 8:00 PM" },
      { day: "Friday", hours: "3:00 PM – 7:00 PM" },
      { day: "Saturday", hours: "9:00 AM – 5:00 PM" },
      { day: "Sunday", hours: "9:30 AM – 3:00 PM" },
    ],
  },
];

export function ContactLocations() {
  const [activeLocationId, setActiveLocationId] = useState<string>("markham");

  const activeLocation =
    LOCATIONS.find((loc) => loc.id === activeLocationId) || LOCATIONS[0];

  const fullAddress = `${activeLocation.address}, ${activeLocation.city}, ${activeLocation.province} ${activeLocation.postalCode}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    fullAddress,
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress,
  )}`;

  return (
    <div className="space-y-10">
      {/* Location Selector Tabs */}
      <div className="flex flex-col items-center">
        <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner max-w-full overflow-x-auto">
          {LOCATIONS.map((loc) => {
            const isActive = loc.id === activeLocation.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocationId(loc.id)}
                className={`relative px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-brand-600 shadow-sm border border-slate-200/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <MapPin
                  size={16}
                  className={isActive ? "text-brand-500" : "text-slate-400"}
                />
                <span>{loc.name}</span>
                {loc.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                      isActive
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {loc.name === "Richmond Hill" ? "New" : loc.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Location Info Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Cards & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Banner Card */}
          <div className="glass-card p-6 bg-gradient-to-br from-brand-50/50 via-white to-teal-50/30 border-brand-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
                  {activeLocation.badge || "Campus"}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {activeLocation.city}, Greater Toronto Area
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Swan Swim Academy — {activeLocation.name}
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              {activeLocation.tagline}
            </p>

            {/* Quick pool specs */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-xs text-slate-400 font-medium">
                  Water Temp
                </div>
                <div className="text-sm font-bold text-brand-600 mt-0.5">
                  {activeLocation.poolDetails.temp}
                </div>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-xs text-slate-400 font-medium">
                  Pool Size
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {activeLocation.poolDetails.length}
                </div>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-xs text-slate-400 font-medium">
                  Filtration
                </div>
                <div className="text-sm font-bold text-teal-600 mt-0.5">
                  {activeLocation.poolDetails.type}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Phone */}
            <a
              href={`tel:${activeLocation.phone.replace(/[^0-9+]/g, "")}`}
              className="glass-card p-5 flex items-start gap-3.5 group hover:border-brand-200 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                <Phone size={20} className="text-brand-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Direct Phone
                </h3>
                <p className="text-brand-600 font-bold text-base mt-0.5">
                  {activeLocation.phone}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Call or text reception
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${activeLocation.email}`}
              className="glass-card p-5 flex items-start gap-3.5 group hover:border-brand-200 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                <Mail size={20} className="text-brand-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Location Email
                </h3>
                <p className="text-brand-600 font-semibold text-sm truncate mt-0.5">
                  {activeLocation.email}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Replies within a few hours
                </p>
              </div>
            </a>
          </div>

          {/* Address Card with Get Directions Link */}
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Physical Address
                  </h3>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {activeLocation.address}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {activeLocation.city}, {activeLocation.province}{" "}
                    {activeLocation.postalCode}
                  </p>
                </div>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-xl transition-colors shrink-0"
              >
                <span>Directions</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Key Facility Highlights */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Facility Features
              </h4>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {activeLocation.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="glass-card p-2 overflow-hidden">
            <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden relative bg-slate-100">
              <iframe
                key={activeLocation.id}
                title={`Google Map for Swan Swim School ${activeLocation.name}`}
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-brand-500" />
                {fullAddress}
              </span>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                View Larger Map
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Hours & Quick Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operating Hours Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-teal-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {activeLocation.name} Pool Hours
                </h3>
                <p className="text-slate-400 text-xs">
                  Lessons & administration scheduled hours
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activeLocation.hours.map((schedule) => (
                <div
                  key={schedule.day}
                  className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-slate-600 font-medium text-sm">
                    {schedule.day}
                  </span>
                  <span className="text-slate-900 font-semibold text-sm">
                    {schedule.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick CTA Box */}
          <div className="glass-card p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-white">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">
              Book a Free Assessment
            </h3>
            <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
              Visit our {activeLocation.name} facility for a free 20-minute swim
              level assessment with our certified instructors.
            </p>
            <Link
              href={`/trial?location=${activeLocation.id}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-display font-bold text-sm bg-white text-brand-700 hover:bg-brand-50 transition-all shadow-md group"
            >
              <span>Book Free Trial at {activeLocation.name}</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
