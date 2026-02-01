import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

export async function getLocations(): Promise<Location[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/locations`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch locations");
  }

  return res.json();
}
