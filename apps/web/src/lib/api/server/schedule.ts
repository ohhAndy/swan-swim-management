import type { SlotPage, Term } from "@school/shared-types";
import { serverFetch } from "../_fetch/server";

export interface DetailedTimeSlot {
  time: string;
  offeringCount: number;
  realCapacity: number;
  filledSeats: number;
}

export async function getSlotPage(
  termId: string,
  weekday: number,
  start: string,
  end: string,
): Promise<SlotPage> {
  const res = await serverFetch(
    `/terms/${termId}/schedule/weekday/${weekday}/slot/${start}/${end}`,
  );
  return res.json();
}

export async function getTimeSlotsByWeekday(
  termId: string,
  weekday: number,
): Promise<string[]> {
  const res = await serverFetch(
    `/terms/${termId}/schedule/weekday/${weekday}/slots`,
  );
  return res.json();
}

export async function getDetailedTimeSlotsByWeekday(
  termId: string,
  weekday: number,
): Promise<DetailedTimeSlot[]> {
  const res = await serverFetch(
    `/terms/${termId}/schedule/weekday/${weekday}/slots-detailed`,
  );
  return res.json();
}

export async function getTermTitle(termId: string): Promise<string> {
  const res = await serverFetch(`/terms/${termId}`);
  return res.text();
}

export async function getAllTerms(): Promise<Term[]> {
  const res = await serverFetch(`/terms/all`);
  return res.json();
}

/** Returns all terms across every location — bypasses the location filter. */
export async function getAllTermsUnfiltered(): Promise<Term[]> {
  const res = await serverFetch(`/terms/all`, { skipLocationHeader: true });
  return res.json();
}

export async function scheduleMakeUp(payload: {
  studentId: string;
  classSessionId: string;
  note?: string;
}) {
  const res = await serverFetch(`/makeups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function enrollStudentWithSkips(payload: {
  studentId: string;
  offeringId: string;
  skippedDates: string[];
}) {
  const res = await serverFetch(`/enrollments/with-skip`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transferEnrollment(
  enrollmentId: string,
  data: {
    targetOfferingId: string;
    skippedSessionIds: string[];
    transferNotes?: string;
  },
) {
  const res = await serverFetch(`/enrollments/${enrollmentId}/transfer`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAvailableClassesForTransfer(
  termId: string,
  currentOfferingId: string,
  level?: string,
) {
  const params = new URLSearchParams({
    termId,
    excludeOfferingId: currentOfferingId,
  });
  if (level) {
    params.set("level", level);
  }
  const res = await serverFetch(
    `/offerings/available-for-transfer?${params.toString()}`,
  );
  return res.json();
}

export async function getDailySchedule(date: string) {
  const res = await serverFetch(`/terms/schedule/date/${date}`);
  return res.json();
}

export async function getFlexibleSchedule(termId: string): Promise<SlotPage> {
  const res = await serverFetch(`/terms/${termId}/flexible-schedule`);
  return res.json();
}
