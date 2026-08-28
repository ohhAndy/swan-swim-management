"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Baby,
  Calendar,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import { fetchPublicAPI } from "@/lib/api";
import { format, parseISO } from "date-fns";

interface TrialDate {
  date: string;
  dayOfWeek: string;
}

export interface LocationOption {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
}

export const TRIAL_LOCATIONS: LocationOption[] = [
  {
    id: "markham_branch",
    slug: "markham",
    name: "Markham",
    address: "8500 Warden Ave",
    city: "Markham",
  },
  {
    id: "loc_main_branch_001",
    slug: "newmarket",
    name: "Newmarket",
    address: "17215 Lesile St",
    city: "Newmarket",
  },
  {
    id: "AGC_branch",
    slug: "Angus-glen",
    name: "Swim Team",
    address: "3990 Major Mackenzie Drive East",
    city: "Markham",
  },
];

interface FormData {
  locationSlug: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childAge: string;
  preferredDates: string[];
  notes: string;
}

const COOKIE_NAME = "__swan_trial";
const MAX_DATES = 3;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function TrialFormInner() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location");

  const [locations, setLocations] = useState<LocationOption[]>(TRIAL_LOCATIONS);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    locationSlug: "markham",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    childName: "",
    childAge: "",
    preferredDates: [],
    notes: "",
  });

  // Fetch dynamic locations from Supabase via API
  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await fetchPublicAPI<
          Array<{ id: string; name: string; slug: string; address?: string | null }>
        >("/locations");
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LocationOption[] = data.map((l) => ({
            id: l.id,
            slug: l.slug || l.id,
            name: l.name,
            address: l.address || "",
            city: l.slug?.toLowerCase().includes("newmarket") ? "Newmarket" : "Markham",
          }));
          setLocations(mapped);
        }
      } catch (e) {
        console.error("Failed to load trial locations:", e);
      }
    }
    loadLocations();
  }, []);

  // Sync initial location from URL param if available
  useEffect(() => {
    if (locationParam) {
      const match = locations.find(
        (l) => l.slug.toLowerCase() === locationParam.toLowerCase() || l.id === locationParam
      );
      if (match) {
        setFormData((prev) => ({ ...prev, locationSlug: match.slug }));
      }
    }
  }, [locationParam, locations]);

  const [availableDates, setAvailableDates] = useState<TrialDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check for existing submission cookie
  useEffect(() => {
    const cookie = getCookie(COOKIE_NAME);
    if (cookie) {
      setHasExistingRequest(true);
    }
  }, []);

  // Fetch available dates
  const loadDates = useCallback(async () => {
    try {
      setLoadingDates(true);
      const dates = await fetchPublicAPI<TrialDate[]>("/trial-dates");
      setAvailableDates(dates);
    } catch {
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  }, []);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleDate = (dateStr: string) => {
    setFormData((prev) => {
      const dates = prev.preferredDates.includes(dateStr)
        ? prev.preferredDates.filter((d) => d !== dateStr)
        : prev.preferredDates.length < MAX_DATES
          ? [...prev.preferredDates, dateStr]
          : prev.preferredDates;
      return { ...prev, preferredDates: dates };
    });
  };

  const selectedLocation =
    locations.find((l) => l.slug === formData.locationSlug) ||
    locations[0];

  const validateStep = (stepNum: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.locationSlug) {
        errors.locationSlug = "Please select a preferred pool location";
      }
      if (!formData.parentName.trim() || formData.parentName.trim().length < 2) {
        errors.parentName = "Please enter your name";
      }
      if (
        !formData.parentPhone.trim() ||
        formData.parentPhone.replace(/\D/g, "").length < 7
      ) {
        errors.parentPhone = "Please enter a valid phone number";
      }
    }

    if (stepNum === 2) {
      if (!formData.childName.trim() || formData.childName.trim().length < 2) {
        errors.childName = "Please enter your child's name";
      }
      const age = parseInt(formData.childAge);
      if (!formData.childAge || isNaN(age) || age < 0 || age > 18) {
        errors.childAge = "Please enter a valid age (0–18)";
      }
    }

    if (stepNum === 3) {
      if (formData.preferredDates.length === 0) {
        errors.preferredDates = "Please select at least one preferred date";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const result = await fetchPublicAPI<{
        success: boolean;
        cookieId: string;
        message: string;
      }>("/trial-requests", {
        method: "POST",
        body: JSON.stringify({
          locationSlug: formData.locationSlug,
          parentName: formData.parentName.trim(),
          parentPhone: formData.parentPhone.trim(),
          parentEmail: formData.parentEmail.trim() || undefined,
          childName: formData.childName.trim(),
          childAge: parseInt(formData.childAge),
          preferredDates: formData.preferredDates,
          notes: formData.notes.trim() || undefined,
          cookieId: getCookie(COOKIE_NAME) || undefined,
        }),
      });

      if (result.success) {
        setCookie(COOKIE_NAME, result.cookieId, 7);
        setSubmitted(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or call us directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============ SUCCESS STATE ============
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-50 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-teal-500" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-3">
          Trial Request Submitted!
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Thank you! We&apos;ve received your request for our{" "}
          <strong className="text-slate-800">{selectedLocation.name}</strong>{" "}
          and will contact you within 24 hours to confirm your trial lesson.
        </p>
        <div className="glass-card p-6 max-w-sm mx-auto text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Location</span>
            <span className="font-medium text-brand-600">
              {selectedLocation.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Child</span>
            <span className="font-medium text-slate-700">
              {formData.childName}, age {formData.childAge}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Dates</span>
            <span className="font-medium text-slate-700">
              {formData.preferredDates
                .map((d) => format(parseISO(d), "MMM d"))
                .join(", ")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Location & Info" },
    { num: 2, label: "Child Info" },
    { num: 3, label: "Pick Dates" },
    { num: 4, label: "Review" },
  ];

  return (
    <div>
      {/* Existing request banner */}
      {hasExistingRequest && (
        <div className="mb-8 p-4 bg-brand-50 border border-brand-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-brand-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-brand-800 font-medium text-sm">
              You&apos;ve already submitted a trial request!
            </p>
            <p className="text-brand-600 text-sm mt-1">
              We&apos;ll be in touch soon. You can still submit another request if needed.
            </p>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.num
                    ? "bg-teal-500 text-white"
                    : step === s.num
                      ? "bg-brand-500 text-white ring-4 ring-brand-100"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.num ? <CheckCircle2 size={18} /> : s.num}
              </div>
              <span
                className={`mt-2 text-xs font-medium hidden sm:block ${
                  step >= s.num ? "text-brand-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 lg:w-28 h-0.5 mx-2 transition-colors ${
                  step > s.num ? "bg-teal-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ============ STEP 1: Location & Parent Info ============ */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">
              Select Location & Your Information
            </h2>
            <p className="text-slate-500 text-sm">
              Choose your preferred facility and how we can reach you.
            </p>
          </div>

          {/* Location Choice Cards */}
          <div>
            <label className="form-label mb-2.5">
              <MapPin size={14} className="inline mr-1.5 text-brand-500" />
              Preferred Pool Location *
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {locations.map((loc) => {
                const isSelected = formData.locationSlug === loc.slug;
                return (
                  <button
                    key={loc.slug}
                    type="button"
                    onClick={() => updateField("locationSlug", loc.slug)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/80 ring-2 ring-brand-100 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isSelected ? "text-brand-600" : "text-slate-500"
                        }`}
                      >
                        {loc.city}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-brand-600" />
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {loc.name}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {loc.address}
                    </p>
                  </button>
                );
              })}
            </div>
            {fieldErrors.locationSlug && (
              <p className="form-error">{fieldErrors.locationSlug}</p>
            )}
          </div>

          <div>
            <label htmlFor="parentName" className="form-label">
              <User size={14} className="inline mr-1.5" />
              Full Name *
            </label>
            <input
              type="text"
              id="parentName"
              className="form-input"
              placeholder="e.g. Jane Smith"
              value={formData.parentName}
              onChange={(e) => updateField("parentName", e.target.value)}
            />
            {fieldErrors.parentName && (
              <p className="form-error">{fieldErrors.parentName}</p>
            )}
          </div>

          <div>
            <label htmlFor="parentPhone" className="form-label">
              <Phone size={14} className="inline mr-1.5" />
              Phone Number *
            </label>
            <input
              type="tel"
              id="parentPhone"
              className="form-input"
              placeholder="(555) 123-4567"
              value={formData.parentPhone}
              onChange={(e) => updateField("parentPhone", e.target.value)}
            />
            {fieldErrors.parentPhone && (
              <p className="form-error">{fieldErrors.parentPhone}</p>
            )}
          </div>

          <div>
            <label htmlFor="parentEmail" className="form-label">
              <Mail size={14} className="inline mr-1.5" />
              Email (optional)
            </label>
            <input
              type="email"
              id="parentEmail"
              className="form-input"
              placeholder="jane@example.com"
              value={formData.parentEmail}
              onChange={(e) => updateField("parentEmail", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ============ STEP 2: Child Info ============ */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">
              About Your Child
            </h2>
            <p className="text-slate-500 text-sm">
              This helps our coaches place your child in the ideal skill group.
            </p>
          </div>

          <div>
            <label htmlFor="childName" className="form-label">
              <Baby size={14} className="inline mr-1.5" />
              Child&apos;s Name *
            </label>
            <input
              type="text"
              id="childName"
              className="form-input"
              placeholder="e.g. Emma"
              value={formData.childName}
              onChange={(e) => updateField("childName", e.target.value)}
            />
            {fieldErrors.childName && (
              <p className="form-error">{fieldErrors.childName}</p>
            )}
          </div>

          <div>
            <label htmlFor="childAge" className="form-label">
              <Calendar size={14} className="inline mr-1.5" />
              Child&apos;s Age *
            </label>
            <input
              type="number"
              id="childAge"
              className="form-input"
              placeholder="e.g. 5"
              min="0"
              max="18"
              value={formData.childAge}
              onChange={(e) => updateField("childAge", e.target.value)}
            />
            {fieldErrors.childAge && (
              <p className="form-error">{fieldErrors.childAge}</p>
            )}
          </div>
        </div>
      )}

      {/* ============ STEP 3: Date Selection ============ */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">
              Pick Your Preferred Dates
            </h2>
            <p className="text-slate-500 text-sm">
              Select up to {MAX_DATES} dates that work for you at our{" "}
              <strong>{selectedLocation.name}</strong>.
            </p>
          </div>

          {loadingDates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-brand-500 animate-spin" />
              <span className="ml-3 text-slate-500">Loading available dates...</span>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">
                No trial dates available right now. Please contact us directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableDates.map((d) => {
                const selected = formData.preferredDates.includes(d.date);
                const disabled =
                  !selected && formData.preferredDates.length >= MAX_DATES;

                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => toggleDate(d.date)}
                    disabled={disabled}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                        : disabled
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 cursor-pointer"
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                        selected ? "text-brand-600" : "text-slate-400"
                      }`}
                    >
                      {d.dayOfWeek}
                    </div>
                    <div
                      className={`font-bold text-lg ${
                        selected ? "text-brand-700" : "text-slate-700"
                      }`}
                    >
                      {format(parseISO(d.date), "MMM d")}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {fieldErrors.preferredDates && (
            <p className="form-error">{fieldErrors.preferredDates}</p>
          )}

          {formData.preferredDates.length > 0 && (
            <p className="text-sm text-brand-600 font-medium">
              {formData.preferredDates.length} of {MAX_DATES} dates selected
            </p>
          )}
        </div>
      )}

      {/* ============ STEP 4: Review ============ */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-1">
              Review & Submit
            </h2>
            <p className="text-slate-500 text-sm">
              Confirm your details before submitting your request.
            </p>
          </div>

          <div className="glass-card p-6 space-y-4">
            {/* Location preview */}
            <div className="pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Selected Location
                  </span>
                  <p className="text-slate-900 font-bold text-base">
                    {selectedLocation.name}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {selectedLocation.address}, {selectedLocation.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Change
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Parent Info
                </span>
                <p className="text-slate-800 font-medium mt-1">
                  {formData.parentName}
                </p>
                <p className="text-slate-500 text-sm">{formData.parentPhone}</p>
                {formData.parentEmail && (
                  <p className="text-slate-500 text-sm">{formData.parentEmail}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Child
                </span>
                <p className="text-slate-800 font-medium mt-1">
                  {formData.childName}, age {formData.childAge}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Preferred Dates
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.preferredDates.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium"
                  >
                    <Calendar size={14} />
                    {format(parseISO(d), "EEEE, MMM d")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="form-label">
              <MessageSquare size={14} className="inline mr-1.5" />
              Additional Notes (optional)
            </label>
            <textarea
              id="notes"
              className="form-input min-h-[100px] resize-y"
              placeholder="Anything else we should know? (swimming experience, special requirements, etc.)"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ============ Navigation ============ */}
      <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="btn-secondary !py-2.5 !px-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="btn-primary !py-2.5 !px-6"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary !py-3 !px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <CheckCircle2 size={18} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function TrialForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-brand-500 animate-spin" />
        </div>
      }
    >
      <TrialFormInner />
    </Suspense>
  );
}
