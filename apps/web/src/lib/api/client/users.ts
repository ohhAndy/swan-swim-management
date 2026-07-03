import { clientFetch } from "../_fetch/client";
import type { StaffUser, StaffRole } from "@prisma/client";
export type { StaffUser, StaffRole };

export async function getStaffUsers(): Promise<StaffUser[]> {
  const res = await clientFetch(`/staff-users`, {
  });
  return res.json();
}
