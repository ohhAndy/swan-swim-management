import { clientFetch } from "../_fetch/client";
export type StaffRole = "admin" | "manager" | "supervisor" | "viewer";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const res = await clientFetch(`/staff-users`, {
  });
  return res.json();
}
