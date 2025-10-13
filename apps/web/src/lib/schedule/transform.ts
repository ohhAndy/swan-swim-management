import type { SlotPage, RosterResponse } from "@school/shared-types";

export const weekdayName = (n: number) =>
  ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][n] ?? `Day ${n}`;

export function groupByOffering(slot: SlotPage): {
  offeringKey: string;
  title: string;
  notes: string;
  rosters: RosterResponse[];
}[] {
  const byOffering = new Map<string, { title: string; notes: string; rosters: RosterResponse[] }>();
  for (const day of slot.days) {
    for (const r of day.rosters) {
      const key = r.session.offeringId;
      const title = r.session.offeringTitle ?? `Offering ${r.session.offeringId}`;
      const notes = r.session.offeringNotes ?? "";
      const entry = byOffering.get(key) ?? { title, notes, rosters: [] };
      entry.rosters.push(r);
      byOffering.set(key, entry);
    }
  }
  return Array.from(byOffering.entries())
    .map(([offeringKey, v]) => ({ offeringKey, ...v }))
    .sort((a, b) => a.title.localeCompare(b.title));
}