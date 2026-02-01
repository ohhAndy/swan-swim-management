import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type RevenueByLocation = {
  locationId: string;
  locationName: string;
  revenue: number;
};

export type RevenueByTerm = {
  termId: string;
  termName: string;
  revenue: number;
};

export async function getRevenueByLocation(): Promise<RevenueByLocation[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/analytics/financial/location`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch revenue by location");
  }

  return res.json();
}

export async function getRevenueByTerm(): Promise<RevenueByTerm[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/analytics/financial/term`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch revenue by term");
  }

  return res.json();
}
