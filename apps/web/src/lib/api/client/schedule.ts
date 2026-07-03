import type { SlotPage, Term } from "@school/shared-types";
import { clientFetch } from "../_fetch/client";

export async function getSlotPage(
  termId: string,
  weekday: number,
  start: string,
  end: string,
): Promise<SlotPage> {
  const res = await clientFetch(
    `/terms/${termId}/schedule/weekday/${weekday}/slot/${start}/${end}`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function getTimeSlotsByWeekday(
  termId: string,
  weekday: number,
): Promise<string[]> {
  const res = await clientFetch(
    `/terms/${termId}/schedule/weekday/${weekday}/slots`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function getTermTitle(termId: string): Promise<string> {
  const res = await clientFetch(`/terms/${termId}`, { cache: "no-store" });
  return res.text();
}

export async function getAllTerms(): Promise<Term[]> {
  const res = await clientFetch(`/terms/all`, { cache: "no-store" });
  return res.json();
}

export async function scheduleMakeUp(payload: {
  studentId: string;
  classSessionId: string;
  note?: string;
  classRatio?: string;
}) {
  const res = await clientFetch(`/makeups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function enrollStudentWithSkips(payload: {
  studentId: string;
  offeringId: string;
  skippedDates: string[];
  classRatio: string;
}) {
  const res = await clientFetch(`/enrollments/with-skip`, {
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
  const res = await clientFetch(`/enrollments/${enrollmentId}/transfer`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function bulkTransferEnrollments(
  transfers: { enrollmentId: string; targetOfferingId: string; transferNotes?: string }[],
) {
  const res = await clientFetch(`/enrollments/bulk-transfer`, {
    method: "POST",
    body: JSON.stringify({ transfers }),
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
  const res = await clientFetch(
    `/offerings/available-for-transfer?${params.toString()}`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function updateOfferingInfo(offeringId: string, title: string) {
  const res = await clientFetch(`/offerings/${offeringId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function createOffering(payload: {
  termId: string;
  type?: "regular" | "flexible";
  weekday?: number;
  startTime?: string;
  title: string;
  capacity: number;
  duration?: number;
  notes?: string;
  sessions?: { date: string; startTime: string; endTime: string }[];
}) {
  const res = await clientFetch(`/offerings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteOffering(offeringId: string) {
  const res = await clientFetch(`/offerings/${offeringId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function getTermAvailability(
  termId: string,
  level?: string,
  weekday?: number,
): Promise<
  Record<
    number,
    Array<{
      offeringId: string;
      title: string;
      time: string;
      capacity: number;
      sessions: Array<{
        date: string;
        openSeats: number;
      }>;
      instructors: string[];
    }>
  >
> {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (weekday !== undefined) params.set("weekday", weekday.toString());
  const res = await clientFetch(
    `/terms/${termId}/availability?${params.toString()}`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function deleteEnrollment(enrollmentId: string) {
  const res = await clientFetch(`/enrollments/${enrollmentId}`, {
    method: "DELETE",
  });
  return res.json();
}
