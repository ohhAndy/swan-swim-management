import type { TrialStatus } from "@school/shared-types";
import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function createTrialBooking(payload: {
  classSessionId: string;
  childName: string;
  childAge: number;
  parentPhone: string;
  notes?: string;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create trial booking");
  }

  return res.json();
}

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus | ""
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(
      `Failed to update trial status: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}

export async function convertTrialToStudent(
  trialId: string,
  studentId: string
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}/convert`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ studentId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to convert trial");
  }

  return res.json();
}

export async function deleteTrialBooking(trialId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete trial booking");
  }

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
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/upcoming`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch upcoming trials");
  }
  return res.json();
}

export async function getPastTrials() {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/past`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch past trials");
  }
  return res.json();
}

export async function getTrialStats(): Promise<TrialStats> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/trial-bookings/stats`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trial stats");
  }
  return res.json();
}
