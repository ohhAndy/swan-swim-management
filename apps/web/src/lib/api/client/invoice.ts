import { clientFetch } from "../_fetch/client";

import type { 
  Guardian, 
  Student, 
  Term, 
  Offering as ClassOffering, 
  EnrollmentSkip, 
  Enrollment, 
  InvoiceLineItem, 
  Payment, 
  Invoice 
} from "../../types/models";
export type { 
  Guardian, 
  Student, 
  Term, 
  ClassOffering, 
  EnrollmentSkip, 
  Enrollment, 
  InvoiceLineItem, 
  Payment, 
  Invoice 
};

export interface CreateInvoiceData {
  invoiceNumber?: string;
  guardianId?: string;
  totalAmount: number;
  notes?: string;
  createdAt?: string;
  lineItems: {
    enrollmentId?: string;
    description: string;
    amount: number;
  }[];
}

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod:
    | "cash"
    | "debit"
    | "visa"
    | "mastercard"
    | "etransfer"
    | "website"
    | "other";
  notes?: string;
}

export async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  const res = await clientFetch(`/invoices`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getInvoices(params?: {
  search?: string;
  status?: "paid" | "partial" | "void" | "all";
  guardianId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "invoiceNumber";
  sortOrder?: "asc" | "desc";
  includeAllLocations?: boolean;
  needsRecovery?: boolean;
}) {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.guardianId) queryParams.append("guardianId", params.guardianId);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params?.includeAllLocations)
    queryParams.append("includeAllLocations", "true");
  if (params?.needsRecovery) queryParams.append("needsRecovery", "true");

  const res = await clientFetch(`/invoices?${queryParams}`);
  return res.json();
}

export async function getInvoice(id: string): Promise<Invoice> {
  const res = await clientFetch(`/invoices/${id}`);
  return res.json();
}

export async function updateInvoice(
  id: string,
  data: {
    invoiceNumber?: string;
    locationId?: string;
    totalAmount?: number;
    status?: "paid" | "partial" | "void";
    notes?: string;
    createdAt?: string;
    lineItems?: {
      id?: string;
      enrollmentId?: string;
      description?: string;
      amount?: number;
    }[];
  },
): Promise<Invoice> {
  const res = await clientFetch(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteInvoice(id: string): Promise<void> {
  await clientFetch(`/invoices/${id}`, { method: "DELETE" });
}

export async function getUnInvoicedEnrollments(params?: {
  guardianId?: string;
  termId?: string;
  page?: number;
  limit?: number;
  includeAllLocations?: boolean;
}) {
  const queryParams = new URLSearchParams();

  if (params?.guardianId) queryParams.append("guardianId", params.guardianId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.includeAllLocations)
    queryParams.append("includeAllLocations", "true");

  const res = await clientFetch(
    `/invoices/un-invoiced-enrollments?${queryParams}`,
  );
  return res.json();
}

export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const res = await clientFetch(`/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPaymentsByInvoice(
  invoiceId: string,
): Promise<Payment[]> {
  const res = await clientFetch(`/payments/invoice/${invoiceId}`);
  return res.json();
}

export async function deletePayment(id: string): Promise<void> {
  await clientFetch(`/payments/${id}`, { method: "DELETE" });
}
