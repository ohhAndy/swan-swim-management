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
    };
  };
}

export async function getUninvoicedEnrollments(): Promise<
  UninvoicedEnrollment[]
> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/enrollments/uninvoiced`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch uninvoiced enrollments");
  return res.json();
}
