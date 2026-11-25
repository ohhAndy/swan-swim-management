/**
 * Date & Timezone Utilities for Swan Swim Management
 *
 * Physical facilities operate strictly in Ontario, Canada (America/Toronto).
 * These helpers guarantee deterministic Toronto business day calculations
 * regardless of whether code executes on Render (UTC), local machines, or Vercel.
 */

export const BUSINESS_TIMEZONE = "America/Toronto";

/**
 * Returns the current calendar date in America/Toronto as a "YYYY-MM-DD" string.
 *
 * Example: At 9:00 PM EDT on September 7, returns "2026-09-07"
 * (while toISOString().split('T')[0] would return "2026-09-08" due to UTC rollover).
 */
export function getTorontoDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Toronto's calendar date `daysFromToday` away, in the form @db.Date columns
 * store it (UTC midnight). Compare calendar-date columns (session date, term
 * end) against this, never against `new Date()`: after 8pm in Toronto the UTC
 * clock is already on tomorrow.
 */
export function getTorontoCalendarDate(
  daysFromToday = 0,
  now: Date = new Date(),
): Date {
  const [y, m, d] = getTorontoDateString(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + daysFromToday));
}

/**
 * Returns a UTC Date object representing 00:00:00.000 (midnight start of day)
 * in America/Toronto.
 *
 * Automatically accounts for Eastern Daylight Time (EDT: UTC-4) and Eastern Standard Time (EST: UTC-5).
 */
export function getTorontoStartOfDay(date: Date = new Date()): Date {
  const dateStr = getTorontoDateString(date);
  const [y, m, d] = dateStr.split("-").map(Number);

  // Sample at noon UTC on that day to accurately retrieve Toronto's offset
  const sample = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const torontoHourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(sample);

  const torontoHour = parseInt(torontoHourStr, 10);
  const offsetHours = 12 - torontoHour; // 4 in EDT, 5 in EST

  return new Date(Date.UTC(y, m - 1, d, offsetHours, 0, 0, 0));
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

function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

const torontoDayStart = (ymd: string) =>
  getTorontoStartOfDay(new Date(`${ymd}T12:00:00Z`));

/**
 * Prisma filter for timestamps (e.g. createdAt) whose Toronto calendar day is
 * between `from` and `to`, both "YYYY-MM-DD" and inclusive.
 */
export function torontoDayRange(
  from?: string,
  to?: string,
): { gte?: Date; lt?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: torontoDayStart(from) }),
    ...(to && { lt: torontoDayStart(nextDay(to)) }),
  };
}

/**
 * Prisma filter for calendar dates stored as UTC midnight (e.g. paymentDate)
 * between `from` and `to`, both "YYYY-MM-DD" and inclusive.
 */
export function calendarDateRange(
  from?: string,
  to?: string,
): { gte?: Date; lt?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(`${from}T00:00:00Z`) }),
    ...(to && { lt: new Date(`${nextDay(to)}T00:00:00Z`) }),
  };
}
