import { PreviousButtonClient } from "./PreviousButtonClient";
import { getTimeSlotsByWeekday } from "@/lib/api/schedule";

async function calcPrev(weekday: number, slotTime: string, termId: string) {
  // 1. Fetch only current day
  const slotsToday = await getTimeSlotsByWeekday(termId, weekday);
  const index = slotsToday.indexOf(slotTime);

  if (index > 0) {
    return { prevWeekday: weekday, prevSlot: slotsToday[index - 1] };
  }

  // First slot (or not found) → go to previous day
  // (weekday + 6) % 7 handles negative modulo for JavaScript
  let prevWeekday = weekday - 1;
  if (prevWeekday < 0) prevWeekday = 6;

  const prevDaySlots = await getTimeSlotsByWeekday(termId, prevWeekday);

  // Return the LAST slot of the previous day
  const lastSlot =
    prevDaySlots.length > 0 ? prevDaySlots[prevDaySlots.length - 1] : "";

  return { prevWeekday, prevSlot: lastSlot };
}

interface PreviousButtonProps {
  baseHref: string;
  weekday: number;
  slotTime: string;
  termId: string;
}

export default async function PreviousButton({
  baseHref,
  weekday,
  slotTime,
  termId,
}: PreviousButtonProps) {
  const { prevWeekday, prevSlot } = await calcPrev(weekday, slotTime, termId);

  if (!prevSlot) return null;
  return (
    <PreviousButtonClient
      baseHref={baseHref}
      prevWeekday={prevWeekday}
      prevSlot={prevSlot}
    />
  );
}
