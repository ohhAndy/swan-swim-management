import { clientFetch } from "../_fetch/client";

export interface RecipientFilter {
  locationId?: string;
  termId?: string;
  level?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instructorId?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  students: string[];
}

export interface SendEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
  attachments?: { filename: string; content: string }[];
}

export async function getRecipients(
  filters: RecipientFilter,
): Promise<Recipient[]> {
  const res = await clientFetch(`/communications/recipients`, {
    method: "POST",
    body: JSON.stringify(filters),
  });

  return res.json();
}

export async function sendEmail(
  data: SendEmailRequest,
): Promise<{ success: boolean; count: number }> {
  const res = await clientFetch(`/communications/send`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}
