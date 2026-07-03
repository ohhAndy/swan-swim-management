import { clientFetch } from "../_fetch/client";

export type GuardianLite = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  waiverSigned?: boolean;
  students?: { firstName: string; lastName: string }[];
};

export async function searchGuardians(query: string): Promise<GuardianLite[]> {
  const res = await clientFetch(
    `/guardians?query=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  const data = (await res.json()) as {
    total: number;
    page: number;
    pageSize: number;
    items: GuardianLite[];
  };
  return data.items;
}

export async function searchGuardiansPage(
  query: string,
  page = 1,
  pageSize = 20,
  options?: { headers?: Record<string, string>; waiverStatus?: string }
) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("page", page.toString());
  params.set("pageSize", pageSize.toString());
  if (options?.waiverStatus) params.set("waiverStatus", options.waiverStatus);

  const res = await clientFetch(`/guardians?${params.toString()}`, {
    cache: "no-store",
    headers: options?.headers,
  });
  return (await res.json()) as {
    total: number;
    page: number;
    pageSize: number;
    items: GuardianLite[];
  };
}

export async function createGuardian(input: {
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  notes?: string;
  waiverSigned?: boolean;
}) {
  const res = await clientFetch(`/guardians`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return (await res.json()) as GuardianLite;
}

export async function updateGuardian(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    phone?: string;
    shortCode?: string;
    notes?: string;
    waiverSigned?: boolean;
  }
) {
  const res = await clientFetch(`/guardians/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return (await res.json()) as GuardianLite;
}
