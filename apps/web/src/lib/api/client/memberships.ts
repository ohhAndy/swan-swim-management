import { clientFetch } from "../_fetch/client";

export interface UninvoicedMembershipItem {
  membershipId: string;
  studentId: string;
  studentName: string;
  guardianId: string;
  guardianName: string;
  feeType: "ANNUAL_REGISTRATION" | "MONTHLY_PRACTICE";
  billingPeriod: string;
  description: string;
  suggestedAmount: number;
}

export interface UninvoicedMembershipsResponse {
  month: string;
  items: UninvoicedMembershipItem[];
  totalCount: number;
  hasActiveMemberships: boolean;
}

export interface StudentMembership {
  id: string;
  studentId: string;
  seasonTermId: string;
  status: "active" | "paused" | "cancelled";
  startDate: string;
  endDate?: string | null;
  annualRegFee: number;
  monthlyPracticeFee: number;
  annualRegPaid: boolean;
  allowedLocationIds: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    guardian?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
  };
  seasonTerm?: {
    id: string;
    name: string;
    location?: { id: string; name: string } | null;
  };
}

export async function getUninvoicedMemberships(params?: {
  guardianId?: string;
  locationId?: string;
  month?: string;
}): Promise<UninvoicedMembershipsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.guardianId) queryParams.append("guardianId", params.guardianId);
  if (params?.locationId) queryParams.append("locationId", params.locationId);
  if (params?.month) queryParams.append("month", params.month);

  const res = await clientFetch(`/memberships/uninvoiced?${queryParams}`, {
    skipLocationHeader: true,
  });
  return res.json();
}

export async function getMemberships(params?: {
  status?: string;
  studentId?: string;
}): Promise<StudentMembership[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.studentId) queryParams.append("studentId", params.studentId);

  const res = await clientFetch(`/memberships?${queryParams}`);
  return res.json();
}

export async function getMembership(id: string): Promise<StudentMembership> {
  const res = await clientFetch(`/memberships/${id}`);
  return res.json();
}

export async function createMembership(data: {
  studentId: string;
  seasonTermId: string;
  startDate: string;
  endDate?: string;
  annualRegFee: number;
  monthlyPracticeFee: number;
  allowedLocationIds: string[];
  notes?: string;
}): Promise<StudentMembership> {
  const res = await clientFetch(`/memberships`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMembership(
  id: string,
  data: {
    status?: "active" | "paused" | "cancelled";
    monthlyPracticeFee?: number;
    annualRegFee?: number;
    annualRegPaid?: boolean;
    allowedLocationIds?: string[];
    endDate?: string;
    notes?: string;
  },
): Promise<StudentMembership> {
  const res = await clientFetch(`/memberships/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}
