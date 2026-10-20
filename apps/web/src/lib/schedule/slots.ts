export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const FULL_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const WEEKDAY_SLOTS = [
  "15:15",
  "16:00",
  "16:45",
  "17:30",
  "18:30",
  "19:15",
  "20:00",
];
export const WEEKEND_SLOTS = [
  "09:30",
  "10:15",
  "11:00",
  "11:45",
  "12:45",
  "13:30",
  "14:15",
];
export const laneLetter = (i: number) => String.fromCharCode(65 + i);
export const YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];

// Add holidays here in YYYY-MM-DD format
export const HOLIDAYS = [
  "2027-02-15", // Family Day
  "2027-03-26", // Good Friday
  "2027-05-24", // Victoria Day
  "2027-07-01", // Canada Day
  "2027-09-06", // Labour Day
  "2027-10-11", // Thanksgiving
];

export function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = m;
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
}

export function formatTimeRange(range: string): string {
  if (!range) return "";
  const [start, end] = range.split("-");
  if (!start || !end) return range;

  const startFmt = formatTime(start);
  const endFmt = formatTime(end);

  // Always strip the suffix from start time as requested
  // "11:45 AM - 12:30 PM" -> "11:45 - 12:30 PM"
  const startWithoutSuffix = startFmt.replace(/ (AM|PM)$/, "");

  return `${startWithoutSuffix} - ${endFmt}`;
}
