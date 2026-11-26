import { clientFetch } from "../_fetch/client";
import type { Location } from "@prisma/client";
export type { Location };

export async function getLocations(): Promise<Location[]> {
  // A stale location header would block the lookup that replaces it
  const res = await clientFetch(`/locations`, { skipLocationHeader: true });

  return res.json();
}
