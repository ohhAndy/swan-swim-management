import type { TokenBalance, TokenSummary } from "@school/shared-types";
import { clientFetch } from "../_fetch/client";

export async function getStudentTokenBalance(
  studentId: string,
  termId?: string,
): Promise<TokenBalance> {
  const url = termId
    ? `/tokens/student/${studentId}/balance?termId=${encodeURIComponent(termId)}`
    : `/tokens/student/${studentId}/balance`;
  const res = await clientFetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch token balance");
  }
  return res.json();
}

export async function getStudentTokenSummaries(
  studentId: string,
): Promise<TokenSummary[]> {
  const res = await clientFetch(`/tokens/student/${studentId}/summaries`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch token summaries");
  }
  return res.json();
}

export async function grantExtraTokens(payload: {
  enrollmentId: string;
  count: number;
  notes: string;
}) {
  const res = await clientFetch(`/tokens/grant`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to grant extra tokens");
  }
  return res.json();
}

export async function voidToken(tokenId: string, notes: string) {
  const res = await clientFetch(`/tokens/${tokenId}`, {
    method: "DELETE",
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to void token");
  }
  return res.json();
}
