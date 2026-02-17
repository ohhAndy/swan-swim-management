import type { FormOutput } from "../zod/term";
import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function createTerm(values: FormOutput) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/terms`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: values.name.trim(),
      slug: values.slug?.trim() || undefined,
      startDate: values.startDate,
      endDate: values.endDate,
      weeks: values.weeks,
      templates: values.templates.map((t) => ({
        title: t.title.trim(),
        weekday: t.weekday,
        startTime: t.startTime,
        duration: t.duration,
        capacity: t.capacity,
        notes: t.notes?.trim() || undefined,
      })),
    }),
  });

  if (!res.ok) {
    let message = `Failed to create term (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message)
        message = Array.isArray(err.message)
          ? err.message.join(", ")
          : err.message;
    } catch {}
    throw new Error(message);
  }

  await res.json();
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export async function getTerms(): Promise<Term[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API}/terms/all`, { headers });
  if (!res.ok) throw new Error("Failed to fetch terms");
  return res.json();
}
