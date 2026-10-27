import type { FormOutput } from "../../zod/term";
import { clientFetch } from "../_fetch/client";

import type { Term } from "@prisma/client";
export type { Term };

export async function createTerm(values: FormOutput) {
  const res = await clientFetch(`/terms`, {
    method: "POST",
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

  await res.json();
}

export async function getTerms(): Promise<Term[]> {
  const res = await clientFetch(`/terms/all`);
  return res.json();
}
