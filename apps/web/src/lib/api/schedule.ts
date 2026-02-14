import type { SlotPage, Term } from "@school/shared-types";
import { createServerSupabaseClient } from "../supabase/server";
import { cookies } from "next/headers";
import { ApiError } from "./error";
import { forbidden } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  const cookieStore = await cookies();
  const locationId = cookieStore.get("swan_location_id")?.value;
  if (locationId) {
    headers["x-location-id"] = locationId;
  }

  return headers;
}

export async function getSlotPage(
  termId: string,
  weekday: number,
  start: string,
  end: string,
): Promise<SlotPage> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API}/terms/${termId}/schedule/weekday/${weekday}/slot/${start}/${end}`,
    { cache: "no-store", headers },
  );
  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, "Failed to fetch slot page");
  }
  return res.json();
}

export async function getTimeSlotsByWeekday(
  termId: string,
  weekday: number,
): Promise<string[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API}/terms/${termId}/schedule/weekday/${weekday}/slots`,
    { cache: "no-store", headers },
  );
  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.statusText,
      "Failed to fetch time slots",
    );
  }
  return res.json();
}

export async function getTermTitle(termId: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/terms/${termId}`, {
    cache: "no-store",
    headers,
  });
  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.statusText,
      `Failed to fetch term title for ${termId}`,
    );
  }
  return res.text();
}

export async function getAllTerms(): Promise<Term[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/terms/all`, { cache: "no-store", headers });
  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, "Failed to fetch terms");
  }
  return res.json();
}

export async function scheduleMakeUp(payload: {
  studentId: string;
  classSessionId: string;
  note?: string;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/makeups`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (res.status === 403) forbidden();
  if (!res.ok)
    throw new ApiError(
      res.status,
      res.statusText,
      await res.text().catch(() => "Make-up failed"),
    );
  return res.json();
}

export async function enrollStudentWithSkips(payload: {
  studentId: string;
  offeringId: string;
  skippedDates: string[];
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/enrollments/with-skip`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (res.status === 403) forbidden();
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new ApiError(
      res.status,
      res.statusText,
      `Failed to enroll student: ${res.status} - ${errorText}`,
    );
  }

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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/enrollments/${enrollmentId}/transfer`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (res.status === 403) forbidden();
  if (!res.ok) {
    const errorText = await res.text();
    throw new ApiError(
      res.status,
      res.statusText,
      `Failed to transfer enrollment: ${res.status} - ${errorText}`,
    );
  }

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
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API}/offerings/available-for-transfer?${params.toString()}`,
    {
      cache: "no-store",
      headers,
    },
  );

  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.statusText,
      `Failed to fetch available classes: ${res.status}`,
    );
  }

  return res.json();
}

export async function getDailySchedule(termId: string, date: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/terms/${termId}/schedule/date/${date}`, {
    cache: "no-store",
    headers,
  });

  if (res.status === 403) forbidden();
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.statusText,
      `Failed to fetch daily schedule: ${res.status}`,
    );
  }

  return res.json();
}
