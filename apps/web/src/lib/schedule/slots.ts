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

  const startSuffix = startFmt.slice(-2);
  const endSuffix = endFmt.slice(-2);

  if (startSuffix === endSuffix) {
    return `${startFmt.replace(" " + startSuffix, "")} - ${endFmt}`;
  }

  return `${startFmt} - ${endFmt}`;
}
