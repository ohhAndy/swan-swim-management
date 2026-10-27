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

export interface PracticeRosterResponse {
  session: {
    id: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    capacity: number;
    title: string;
  };
  checkedInCount: number;
  capacity: number;
  checkedIn: Array<{
    id: string;
    studentId: string;
    name: string;
    status: string;
    markedAt: string;
    acknowledgedOverdue?: boolean | null;
  }>;
  eligibleSwimmers: Array<{
    studentId: string;
    name: string;
    level: string | null;
    membershipId: string;
    paymentStatus: "PAID" | "OVERDUE_GRACE" | "LOCKED";
    daysOverdue: number;
    amountDue: number;
  }>;
}

export async function getPracticeRoster(
  sessionId: string
): Promise<PracticeRosterResponse> {
  const res = await clientFetch(`/attendance/practice-roster/${sessionId}`);
  return res.json();
}

export async function practiceCheckIn(data: {
  classSessionId: string;
  studentId: string;
  status?: "present" | null;
  acknowledgeOverdue?: boolean;
  overrideDelinquency?: boolean;
}): Promise<{ success: boolean }> {
  const res = await clientFetch(`/attendance/practice-checkin`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}
