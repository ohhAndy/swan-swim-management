import { clientFetch } from "../_fetch/client";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
}

export async function getAllStaffUsers(): Promise<StaffUser[]> {
  const res = await clientFetch(`/staff-users`, {
    cache: "no-store",
  });

  return res.json();
}
