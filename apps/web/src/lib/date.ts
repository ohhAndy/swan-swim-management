/**
 * Date & Timezone Utilities for Swan Swim Management (Web Portal)
 *
 * Physical facilities operate strictly in Ontario, Canada (America/Toronto).
 * These helpers guarantee deterministic Toronto business day calculations
 * regardless of whether code executes on Vercel (UTC) or client browsers.
 */

const BUSINESS_TIMEZONE = "America/Toronto";

/**
 * Returns the current calendar date in America/Toronto as a "YYYY-MM-DD" string.
 *
 * Example: At 8:30 PM EDT on September 7 in Toronto, returns "2026-09-07"
 * (preventing UTC rollover from advancing to "2026-09-08").
 */
export function getTorontoDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Returns today's date in Toronto as "YYYY-MM-DD".
 */
export function todayInToronto(): string {
  return getTorontoDateString(new Date());
}

/**
 * The "YYYY-MM-DD" of a calendar date the API stores as UTC midnight
 * (term start/end, session date, birthdate). Never read these with local-time
 * methods like getDate() or setHours(): in Toronto they land on the day before.
 */
export function calendarYmd(value: string | Date): string {
  return typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

/** True when today in Toronto falls within [start, end], both calendar dates. */
export function isTodayWithin(start: string | Date, end: string | Date): boolean {
  const today = todayInToronto();
  return calendarYmd(start) <= today && today <= calendarYmd(end);
}

/** Whole years and leftover months from a birthdate to today in Toronto. */
export function ageToday(birthdate: string | Date): {
  years: number;
  months: number;
} {
  const [by, bm, bd] = calendarYmd(birthdate).split("-").map(Number);
  const [ty, tm, td] = todayInToronto().split("-").map(Number);
  const totalMonths = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

/**
 * Safely formats a "YYYY-MM-DD" date string for UI display without timezone shifting.
 */
export function formatCalendarDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.split("T")[0];
  const [year, month, day] = cleanStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;

  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return utcDate.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

/**
 * Formats a timestamp (e.g. an invoice's createdAt) as its calendar day in
 * Toronto. Use formatCalendarDate for values that are already calendar dates.
 */
export function formatTorontoDate(
  timestamp: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!timestamp) return "";
  return formatCalendarDate(getTorontoDateString(new Date(timestamp)), options);
}

/** The same moment moved to another Toronto calendar day ("YYYY-MM-DD"), as an ISO string */
export function moveToTorontoDay(timestamp: string | Date, ymd: string): string {
  const moment = new Date(timestamp);
  const days =
    (Date.parse(ymd) - Date.parse(getTorontoDateString(moment))) / 86_400_000;
  return new Date(moment.getTime() + days * 86_400_000).toISOString();
}
