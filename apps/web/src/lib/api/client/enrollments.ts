import { clientFetch } from "../_fetch/client";

export interface UninvoicedEnrollment {
  id: string;
  enrollDate: string;
  student: {
    firstName: string;
    lastName: string;
    level: string | null;
    guardian: {
      fullName: string;
    };
  };
  offering: {
    weekday: number;
    startTime: string;
    days?: never; // Ensure we don't use this
    level?: never; // Ensure we don't use this
    term: {
      name: string;
      location?: {
        name: string;
      };
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUninvoicedEnrollments(params?: {
  termId?: string;
  locationId?: string;
}): Promise<PaginatedResponse<UninvoicedEnrollment> | UninvoicedEnrollment[]> {
  const queryParams = new URLSearchParams();
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.locationId) queryParams.append("locationId", params.locationId);

  const res = await clientFetch(
    `/enrollments/uninvoiced?${queryParams.toString()}`,
    {
      cache: "no-store",
      skipLocationHeader: true,
    },
  );
  return res.json();
}

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
