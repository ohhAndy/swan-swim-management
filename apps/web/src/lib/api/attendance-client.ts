import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function upsertAttendance(
  enrollmentId: string,
  sessionId: string,
  status: "present" | "absent" | "excused" | ""
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/attendance`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      enrollmentId,
      classSessionId: sessionId,
      status: status || null,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(
      `Failed to Upsert Attendance: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}

export async function updateMakeupStatus(
  makeUpId: string,
  status: "scheduled" | "requested" | "cancelled" | "attended" | "missed" | ""
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/attendance/makeup`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ makeUpId, status: status || null }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(
      `Failed to Upsert Attendance: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}
