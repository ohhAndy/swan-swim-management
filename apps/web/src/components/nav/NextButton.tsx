import { NextButtonClient } from './NextButtonClient'
import { getTimeSlotsByWeekday } from '@/lib/api/schedule' 

async function calcNext(
  weekday: number,
  slotTime: string,
  termId: string
) {

  const timeSlotsByDay: Record<number, string[]> = {}
  for (let d = 0; d < 7; d++) {
    const slots = await getTimeSlotsByWeekday(termId, d)
    timeSlotsByDay[d] = slots
  }

  const slotsToday = timeSlotsByDay[weekday] || []
  const index = slotsToday.indexOf(slotTime)

  if (index === -1 || slotsToday.length === 0) return { nextWeekday: weekday, nextSlot: slotsToday[0] || '' }

  if (index < slotsToday.length - 1) {
    return { nextWeekday: weekday, nextSlot: slotsToday[index + 1] }
  }

  // Last slot → go to next day
  const nextWeekday = (weekday + 1) % 7
  const nextSlots = timeSlotsByDay[nextWeekday] || []
  return { nextWeekday, nextSlot: nextSlots[0] || '' }
}

interface NextButtonProps {
  baseHref: string
  weekday: number
  slotTime: string
  termId: string
}

export default async function NextButton({ baseHref, weekday, slotTime, termId }: NextButtonProps) {
  const { nextWeekday, nextSlot } = await calcNext(weekday, slotTime, termId)

  if (!nextSlot) return null
  return (
    <NextButtonClient baseHref={baseHref} nextWeekday={nextWeekday} nextSlot={nextSlot}/>
  )
}
