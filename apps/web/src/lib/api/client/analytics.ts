import { clientFetch } from "../_fetch/client";

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
  const res = await clientFetch(`/analytics/financial/location`, {
    cache: "no-store",
  });

  return res.json();
}

export async function getRevenueByTerm(): Promise<RevenueByTerm[]> {
  const res = await clientFetch(`/analytics/financial/term`, {
    cache: "no-store",
  });

  return res.json();
}

export type TermFinancialDetails = {
  totalRevenue: number;
  revenueByWeekday: { day: string; revenue: number }[];
  revenueByProgram: { name: string; revenue: number }[];
};

export async function getTermFinancialDetails(
  termId: string,
  startDate?: string,
  endDate?: string,
): Promise<TermFinancialDetails> {
  const searchParams = new URLSearchParams();
  if (startDate) searchParams.set("startDate", startDate);
  if (endDate) searchParams.set("endDate", endDate);

  const res = await clientFetch(
    `/analytics/financial/term/${termId}?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return res.json();
}
