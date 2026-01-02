import { createClient } from "../supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/enrollments/uninvoiced`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch uninvoiced enrollments");
  return res.json();
}
