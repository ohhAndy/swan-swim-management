import { clientFetch } from "../_fetch/client";

export type Payment = {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  invoice: {
    id: string;
    invoiceNumber: string | null;
    notes: string | null;
    guardian?: {
      fullName: string;
    };
    location?: {
      id: string;
      name: string;
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
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (method && method !== "all") params.append("method", method);
  if (query) params.append("query", query);

  const res = await clientFetch(`/payments?${params.toString()}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function createPayment(data: {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}) {
  const res = await clientFetch(`/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePayment(
  id: string,
  data: {
    amount?: number;
    paymentDate?: string;
    paymentMethod?: string;
    notes?: string;
  },
) {
  const res = await clientFetch(`/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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
  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (method && method !== "all") params.append("method", method);
  if (query) params.append("query", query);

  const res = await clientFetch(`/exports/payments?${params.toString()}`);
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
  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (status && status !== "all") params.append("status", status);
  if (query) params.append("query", query);

  const res = await clientFetch(`/exports/invoices?${params.toString()}`);
  return res.blob();
}
