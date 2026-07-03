import { clientFetch } from "../_fetch/client";
export interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

export async function getLocations(): Promise<Location[]> {
  const res = await clientFetch(`/locations`, {
  });

  return res.json();
}
