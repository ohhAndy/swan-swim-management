import { clientFetch } from "../_fetch/client";
import type { Location } from "@prisma/client";
export type { Location };

export async function getLocations(): Promise<Location[]> {
  const res = await clientFetch(`/locations`, {
  });

  return res.json();
}
