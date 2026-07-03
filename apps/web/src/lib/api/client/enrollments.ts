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

export async function getUninvoicedEnrollments(params?: {
  termId?: string;
  locationId?: string;
}): Promise<UninvoicedEnrollment[]> {
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
