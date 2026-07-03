import { clientFetch } from "../_fetch/client";

import type { StaffUser } from "@prisma/client";
export type { StaffUser };

export async function getAllStaffUsers(): Promise<StaffUser[]> {
  const res = await clientFetch(`/staff-users`, {
    cache: "no-store",
  });

  return res.json();
}
