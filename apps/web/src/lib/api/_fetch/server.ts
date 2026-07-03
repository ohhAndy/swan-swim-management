import "server-only";
import { getServerAuthHeaders } from "../server-headers";
import { ApiError } from "../error";
import { forbidden } from "next/navigation";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

/**
 * Fetch wrapper for use in Server Components and Server Actions only.
 * - Automatically attaches the Bearer token from the server Supabase session.
 * - Automatically attaches x-location-id from the cookie store.
 * - Throws ApiError on non-OK responses.
 * - Calls forbidden() on 403 (triggers Next.js 403 boundary).
 */
export async function serverFetch(
  path: string,
  init?: RequestInit & { skipLocationHeader?: boolean },
): Promise<Response> {
  const authHeaders = await getServerAuthHeaders();
  const cookieStore = await cookies();
  const locationId = cookieStore.get("swan_location_id")?.value;

  const headers: Record<string, string> = {
    ...authHeaders,
    ...(locationId && !init?.skipLocationHeader
      ? { "x-location-id": locationId }
      : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const { skipLocationHeader: _, ...restInit } = init ?? {};

  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...restInit,
    headers,
  });

  if (res.status === 403) forbidden();

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, res.statusText, text);
  }

  return res;
}
