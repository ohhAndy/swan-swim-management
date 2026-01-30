import { getHeaders } from "./headers";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getAllStaffUsers(): Promise<StaffUser[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/staff-users`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch staff users");
  }

  return res.json();
}
