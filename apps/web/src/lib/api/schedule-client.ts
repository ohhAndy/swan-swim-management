import type { SlotPage, Term } from "@school/shared-types";
import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getSlotPage(
  termId: string,
  weekday: number,
  start: string,
  end: string
): Promise<SlotPage> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API}/terms/${termId}/schedule/weekday/${weekday}/slot/${start}/${end}`,
    { cache: "no-store", headers }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch slot page");
  }
  return res.json();
}

export async function getTimeSlotsByWeekday(
  termId: string,
  weekday: number
): Promise<string[]> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API}/terms/${termId}/schedule/weekday/${weekday}/slots`,
    { cache: "no-store", headers }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch slot page");
  }
  return res.json();
}

export async function getTermTitle(termId: string): Promise<string> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/terms/${termId}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    throw new Error("Failed to fetch slot page");
  }
  return res.text();
}

export async function getAllTerms(): Promise<Term[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/terms/all`, { cache: "no-store", headers });
  if (!res.ok) {
    throw new Error("Failed to fetch slot page");
  }
  return res.json();
}

export async function scheduleMakeUp(payload: {
  studentId: string;
  classSessionId: string;
  note?: string;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/makeups`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Make-up failed"));
  return res.json();
}

export async function enrollStudentWithSkips(payload: {
  studentId: string;
  offeringId: string;
  skippedDates: string[];
  classRatio: string;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/enrollments/with-skip`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(`Failed to enroll student: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function transferEnrollment(
  enrollmentId: string,
  data: {
    targetOfferingId: string;
    skippedSessionIds: string[];
    transferNotes?: string;
  }
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/enrollments/${enrollmentId}/transfer`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to transfer enrollment: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}

export async function getAvailableClassesForTransfer(
  termId: string,
  currentOfferingId: string,
  level?: string
) {
  const params = new URLSearchParams({
    termId,
    excludeOfferingId: currentOfferingId,
  });

  if (level) {
    params.set("level", level);
  }
  const headers = await getHeaders();
  const res = await fetch(
    `${API}/offerings/available-for-transfer?${params.toString()}`,
    {
      cache: "no-store",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch available classes: ${res.status}`);
  }

  return res.json();
}

export async function updateOfferingInfo(offeringId: string, title: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/offerings/${offeringId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(`Failed to update offering: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function createOffering(payload: {
  termId: string;
  weekday: number;
  startTime: string;
  title: string;
  capacity: number;
  duration?: number;
  notes?: string;
}) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/offerings`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create offering: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function deleteOffering(offeringId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/offerings/${offeringId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Try to parse JSON error if possible
    try {
      const json = JSON.parse(errorText);
      throw new Error(
        json.message || `Failed to delete offering: ${res.status}`
      );
    } catch {
      throw new Error(
        `Failed to delete offering: ${res.status} - ${errorText}`
      );
    }
  }

  return res.json();
}

export async function getTermAvailability(
  termId: string,
  level?: string
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
    }>
  >
> {
  const params = new URLSearchParams();
  if (level) params.set("level", level);

  const headers = await getHeaders();
  const res = await fetch(
    `${API}/terms/${termId}/availability?${params.toString()}`,
    {
      cache: "no-store",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch availability: ${res.status}`);
  }

  return res.json();
}
export async function deleteEnrollment(enrollmentId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/enrollments/${enrollmentId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to delete enrollment: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}
