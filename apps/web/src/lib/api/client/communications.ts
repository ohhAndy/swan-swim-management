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
  id?: string;
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

export interface RecipientSendResult {
  email: string;
  status: "sent" | "failed" | "delivered" | "bounced";
  resendId?: string;
  error?: string;
  updatedAt: string;
}

export interface SendEmailResponse {
  success: boolean;
  total: number;
  successCount: number;
  failureCount: number;
  status: "sent" | "partial" | "failed" | "delivered";
  logId?: string;
  mock?: boolean;
  results: RecipientSendResult[];
}

export interface CommunicationLogItem {
  id: string;
  staffId?: string | null;
  subject: string;
  body: string;
  status: "sent" | "partial" | "failed" | "delivered";
  recipientCount: number;
  successCount: number;
  failureCount: number;
  attachmentCount: number;
  recipients: RecipientSendResult[];
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface CommunicationHistoryResponse {
  items: CommunicationLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
): Promise<SendEmailResponse> {
  const res = await clientFetch(`/communications/send`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getCommunicationHistory(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<CommunicationHistoryResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "all") query.set("status", params.status);

  const res = await clientFetch(`/communications/history?${query.toString()}`, {
    method: "GET",
  });

  return res.json();
}

export async function getCommunicationDetails(
  id: string,
): Promise<CommunicationLogItem> {
  const res = await clientFetch(`/communications/history/${id}`, {
    method: "GET",
  });

  return res.json();
}
