import { createClient } from "../supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

export interface Guardian {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  shortCode?: string;
  dateOfBirth?: string;
  level?: string;
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ClassOffering {
  id: string;
  dayOfWeek: string;
  startTime: string;
  level: string;
  capacity: number;
  term: Term;
}

export interface EnrollmentSkip {
  id: string;
  enrollmentId: string;
  classSessionId: string;
  date: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classOfferingId: string;
  classRatio: string;
  status: string;
  student: Student;
  classOffering: ClassOffering;
  skips?: EnrollmentSkip[];
}

export interface InvoiceLineItem {
  id: string;
  enrollmentId?: string;
  description: string;
  amount: number;
  enrollment?: Enrollment;
}

export interface Payment {
  id: string;
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
  createdAt: string;
  createdByUser?: {
    id: string;
    fullName: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  guardianId: string;
  totalAmount: number;
  status: "paid" | "partial" | "void";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  guardian: Guardian;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  amountPaid: number;
  balance: number;
  calculatedStatus: "paid" | "partial" | "void";
}

export interface CreateInvoiceData {
  invoiceNumber?: string;
  guardianId: string;
  totalAmount: number;
  notes?: string;
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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/invoices`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create invoice");
  }

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
}) {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.guardianId) queryParams.append("guardianId", params.guardianId);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const res = await fetch(`${API}/invoices?${queryParams}`, {
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch invoices (${res.status} ${res.statusText}): ${errorText}`
    );
  }

  return res.json();
}

export async function getInvoice(id: string): Promise<Invoice> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/invoices/${id}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch invoice");
  }

  return res.json();
}

// Update invoice
export async function updateInvoice(
  id: string,
  data: {
    invoiceNumber?: string;
    totalAmount?: number;
    status?: "paid" | "partial" | "void";
    notes?: string;
    lineItems?: {
      id?: string;
      enrollmentId?: string;
      description?: string;
      amount?: number;
    }[];
  }
): Promise<Invoice> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/invoices/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update invoice");
  }

  return res.json();
}

export async function deleteInvoice(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/invoices/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to delete invoice");
  }
}

export async function getUnInvoicedEnrollments(params?: {
  guardianId?: string;
  termId?: string;
  page?: number;
  limit?: number;
}) {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams();

  if (params?.guardianId) queryParams.append("guardianId", params.guardianId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const res = await fetch(
    `${API}/invoices/un-invoiced-enrollments?${queryParams}`,
    { headers }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch un-invoiced enrollments");
  }

  return res.json();
}

export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to record payment");
  }

  return res.json();
}

export async function getPaymentsByInvoice(
  invoiceId: string
): Promise<Payment[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/payments/invoice/${invoiceId}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }

  return res.json();
}

export async function deletePayment(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/payments/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to delete payment");
  }
}
