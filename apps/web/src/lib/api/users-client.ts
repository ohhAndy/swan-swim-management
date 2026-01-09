import { getHeaders } from "./headers";
export type StaffRole = "admin" | "manager" | "supervisor" | "viewer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/staff-users`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch staff users");
  return res.json();
}
