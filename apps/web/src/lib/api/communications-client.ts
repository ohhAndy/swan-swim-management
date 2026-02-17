import { getHeaders } from "./headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/communications/recipients`, {
    method: "POST",
    headers,
    body: JSON.stringify(filters),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recipients");
  }

  return res.json();
}

export async function sendEmail(
  data: SendEmailRequest,
): Promise<{ success: boolean; count: number }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/communications/send`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to send email");
  }

  return res.json();
}
