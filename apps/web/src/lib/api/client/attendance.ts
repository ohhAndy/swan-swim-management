import { clientFetch } from "../_fetch/client";

export async function upsertAttendance(
  enrollmentId: string,
  sessionId: string,
  status: "present" | "absent" | "excused" | "",
  /** Staff confirmed checking in a swim team member who is behind on payments */
  acknowledgedOverdue?: boolean,
) {
  const res = await clientFetch(`/attendance`, {
    method: "PUT",
    body: JSON.stringify({
      enrollmentId,
      classSessionId: sessionId,
      status: status || null,
      ...(acknowledgedOverdue ? { acknowledgedOverdue: true } : {}),
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
