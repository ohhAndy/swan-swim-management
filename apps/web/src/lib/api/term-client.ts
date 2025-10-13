import type { FormOutput } from "../zod/term";
import { createClient } from "@/lib/supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export async function createTerm(values: FormOutput) {
  const headers = await getAuthHeaders();
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

  const data = await res.json();
}
