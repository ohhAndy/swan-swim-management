import type { TrialStatus } from "@school/shared-types";
import { clientFetch } from "../_fetch/client";

export async function createTrialBooking(payload: {
  classSessionId: string;
  childName: string;
  childAge: number;
  parentPhone: string;
  notes?: string;
  classRatio?: string;
}) {
  const res = await clientFetch(`/trial-bookings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus | "",
) {
  const res = await clientFetch(`/trial-bookings/${trialId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return res.json();
}

export async function updateTrialNotes(
  trialId: string,
  notes: string | null,
) {
  const res = await clientFetch(`/trial-bookings/${trialId}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });

  return res.json();
}

export async function convertTrialToStudent(
  trialId: string,
  studentId: string,
) {
  const res = await clientFetch(`/trial-bookings/${trialId}/convert`, {
    method: "PATCH",
    body: JSON.stringify({ studentId }),
  });

  return res.json();
}

export async function deleteTrialBooking(trialId: string) {
  const res = await clientFetch(`/trial-bookings/${trialId}`, {
    method: "DELETE",
  });

  return res.json();
}

export interface TrialStats {
  total: number;
  converted: number;
  scheduled: number;
  attended: number;
  noshow: number;
  cancelled: number;
  notConverted: number;
  conversionRate: number;
}

export async function getUpcomingTrials() {
  const res = await clientFetch(`/trial-bookings/upcoming`, {
  });

  return res.json();
}

export async function getPastTrials() {
  const res = await clientFetch(`/trial-bookings/past`, {
  });

  return res.json();
}

export async function getTrialStats(): Promise<TrialStats> {
  const res = await clientFetch(`/trial-bookings/stats`, {
  });

  return res.json();
}
