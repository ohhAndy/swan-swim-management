import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

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
  const headers = await getHeaders();
  // Remove location header to prevent implicit filtering
  if ("x-location-id" in headers) {
    delete headers["x-location-id"];
  }

  const queryParams = new URLSearchParams();
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.locationId) queryParams.append("locationId", params.locationId);

  const res = await fetch(
    `${API}/enrollments/uninvoiced?${queryParams.toString()}`,
    {
      headers,
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error("Failed to fetch uninvoiced enrollments");
  return res.json();
}
