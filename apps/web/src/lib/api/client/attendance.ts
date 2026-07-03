import { clientFetch } from "../_fetch/client";

export async function upsertAttendance(
  enrollmentId: string,
  sessionId: string,
  status: "present" | "absent" | "excused" | ""
) {
  const res = await clientFetch(`/attendance`, {
    method: "PUT",
    body: JSON.stringify({
      enrollmentId,
      classSessionId: sessionId,
      status: status || null,
    }),
  });
  return res.json();
}

export async function updateMakeupStatus(
  makeUpId: string,
  status: "scheduled" | "requested" | "cancelled" | "attended" | "missed" | ""
) {
  const res = await clientFetch(`/attendance/makeup`, {
    method: "PATCH",
    body: JSON.stringify({ makeUpId, status: status || null }),
  });
  return res.json();
}
