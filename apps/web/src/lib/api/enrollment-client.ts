import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function updateReportCardStatus(
  enrollmentId: string,
  status: string
) {
  const headers = await getHeaders();
  const res = await fetch(
    `${API}/enrollments/${enrollmentId}/report-card-status`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ status }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to update report card status: ${res.status} - ${errorText}`
    );
  }

  return res.json();
}
