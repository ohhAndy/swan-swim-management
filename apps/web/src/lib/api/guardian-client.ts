import { createClient } from "../supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type Address = {
  streetNumber: string;
  streetName: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
};

export type GuardianLite = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  address?: Address | null;
};

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export async function searchGuardians(query: string): Promise<GuardianLite[]> {
  const headers = await getAuthHeaders();
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

export async function createGuardian(input: {
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  address?: Address;
  notes?: string;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/guardians`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok)
    throw new Error(await res.text().catch(() => "Create guardian failed"));
  return (await res.json()) as GuardianLite;
}
