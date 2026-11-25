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
  return res.json();
}

export async function getStudentTokenSummaries(
  studentId: string,
): Promise<TokenSummary[]> {
  const res = await clientFetch(`/tokens/student/${studentId}/summaries`, {
    cache: "no-store",
  });
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
  return res.json();
}

export async function voidToken(tokenId: string, notes: string) {
  const res = await clientFetch(`/tokens/${tokenId}`, {
    method: "DELETE",
    body: JSON.stringify({ notes }),
  });
  return res.json();
}
