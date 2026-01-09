import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type Payment = {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  invoice: {
    id: string;
    invoiceNumber: string | null;
    guardian?: {
      fullName: string;
    };
  };
  createdByUser: {
    fullName: string;
  } | null;
};

export type PaginatedParams = {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  method?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getAllPayments({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  method,
  query,
}: PaginatedParams & { query?: string }): Promise<PaginatedResponse<Payment>> {
  const headers = await getHeaders();

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (method && method !== "all") params.append("method", method);
  if (query) params.append("query", query);

  const res = await fetch(`${API}/payments?${params.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }

  return res.json();
}

export async function exportPayments({
  startDate,
  endDate,
  method,
  query,
}: {
  startDate?: string;
  endDate?: string;
  method?: string;
  query?: string;
}) {
  const headers = await getHeaders();
  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (method && method !== "all") params.append("method", method);
  if (query) params.append("query", query);

  const res = await fetch(`${API}/exports/payments?${params.toString()}`, {
    headers,
  });

  if (!res.ok) throw new Error("Failed to export payments");

  return res.blob();
}

export async function exportInvoices({
  startDate,
  endDate,
  status,
  query,
}: {
  startDate?: string;
  endDate?: string;
  status?: string;
  query?: string;
}) {
  const headers = await getHeaders();
  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (status && status !== "all") params.append("status", status);
  if (query) params.append("query", query);

  const res = await fetch(`${API}/exports/invoices?${params.toString()}`, {
    headers,
  });

  if (!res.ok) throw new Error("Failed to export invoices");

  return res.blob();
}
