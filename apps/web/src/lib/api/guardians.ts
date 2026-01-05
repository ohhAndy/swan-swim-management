import { createServerSupabaseClient } from "../supabase/server";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

export async function getGuardianById(guardianId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/guardians/${guardianId}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch guardian: ${res.status}`);
  }

  return res.json();
}
