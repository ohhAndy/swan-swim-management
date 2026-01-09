import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

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
  const headers = await getHeaders();
  const res = await fetch(
    `${API}/guardians?query=${encodeURIComponent(query)}`,
    { cache: "no-store", headers }
  );
  if (!res.ok) {
    throw new Error(await res.text().catch(() => "Guardian search failed"));
  }
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
  const defaultHeaders = await getHeaders();
  const headers = { ...defaultHeaders, ...options?.headers };

  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("page", page.toString());
  params.set("pageSize", pageSize.toString());
  if (options?.waiverStatus) params.set("waiverStatus", options.waiverStatus);

  const res = await fetch(`${API}/guardians?${params.toString()}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => "Guardian search failed"));
  }
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
  const headers = await getHeaders();
  const res = await fetch(`${API}/guardians`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok)
    throw new Error(await res.text().catch(() => "Create guardian failed"));
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
  const headers = await getHeaders();
  const res = await fetch(`${API}/guardians/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update guardian: ${res.status} - ${errorText}`);
  }

  return (await res.json()) as GuardianLite;
}
