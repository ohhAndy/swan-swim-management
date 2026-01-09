import { createClient } from "@/lib/supabase/client";

export async function getHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  if (typeof window !== "undefined") {
    const locationId = localStorage.getItem("swan_location_id");
    if (locationId) {
      headers["x-location-id"] = locationId;
    }
  }

  return headers;
}
