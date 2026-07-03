import { clientFetch } from "../_fetch/client";

export async function updateReportCardStatus(
  enrollmentId: string,
  status: string,
) {
  const res = await clientFetch(
    `/enrollments/${enrollmentId}/report-card-status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
  return res.json();
}

export async function updateEnrollmentSkips(
  enrollmentId: string,
  skippedSessionIds: string[],
) {
  const res = await clientFetch(`/enrollments/${enrollmentId}/skips`, {
    method: "PUT",
    body: JSON.stringify({ skippedSessionIds }),
  });
  return res.json();
}
