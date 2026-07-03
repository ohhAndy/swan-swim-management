import { getHeaders } from "../headers";
import { ApiError } from "../error";

const API = process.env.NEXT_PUBLIC_API_URL!;

/**
 * Fetch wrapper for use in Client Components only.
 * - Automatically attaches the Bearer token from the browser Supabase session.
 * - Automatically attaches x-location-id from localStorage.
 * - Throws ApiError on non-OK responses.
 *
 * @param skipLocationHeader - Set to true to omit x-location-id (e.g. for cross-location queries)
 */
export async function clientFetch(
  path: string,
  init?: RequestInit & { skipLocationHeader?: boolean },
): Promise<Response> {
  const headers = await getHeaders();

  if (init?.skipLocationHeader) {
    delete headers["x-location-id"];
  }

  // Destructure out skipLocationHeader and headers so they don't bleed into restInit
  const { skipLocationHeader: _skip, headers: extraHeaders, ...restInit } = init ?? {};

  const mergedHeaders: Record<string, string> = {
    ...headers,
    ...((extraHeaders as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API}${path}`, {
    ...restInit,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, res.statusText, text);
  }

  return res;
}
