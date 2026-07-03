import { serverFetch } from "../_fetch/server";

export async function getGuardianById(guardianId: string) {
  const res = await serverFetch(`/guardians/${guardianId}`);
  return res.json();
}
