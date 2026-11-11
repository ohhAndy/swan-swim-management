import { clientFetch } from "../_fetch/client";
import type {
  SwimTeamFeeTier,
  SwimTeamSlotSummary,
} from "@school/shared-types";

export type { SwimTeamFeeTier, SwimTeamSlotSummary };

export interface SwimTeamSeasonSlot {
  offeringId: string;
  title: string;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  capacity: number;
  filled: number;
}

export interface SwimTeamSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  locationId: string | null;
  tiers: SwimTeamFeeTier[];
  slots: SwimTeamSeasonSlot[];
}

export interface SwimTeamRegistrationStanding {
  state: "not_invoiced" | "behind" | "on_track" | "paid";
  behindAmount: number;
  nextDueDate: string | null;
  invoiceIds: string[];
}

export interface SwimTeamRegistration {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string | null;
  guardianId: string;
  termId: string;
  termName: string;
  seasonStart: string;
  seasonEnd: string;
  frequency: number;
  competing: boolean;
  status: "active" | "inactive" | "transferred";
  startDate: string;
  endDate: string | null;
  notes: string | null;
  slots: SwimTeamSlotSummary[];
  standing: SwimTeamRegistrationStanding;
}

export interface UninvoicedSwimTeamRegistration extends SwimTeamRegistration {
  suggestedPracticeFee: number;
  suggestedMeetFee: number;
  monthsRemaining: number;
  seasonMonths: number;
}

export interface SwimTeamFeeSuggestion {
  practiceFee: number;
  meetFee: number;
  invoicedPracticeFee: number;
  invoicedMeetFee: number;
  invoiceIds: string[];
}

export async function getSwimTeamSeasons(): Promise<SwimTeamSeason[]> {
  const res = await clientFetch(`/swim-team/seasons`, { cache: "no-store" });
  return res.json();
}

export async function getSwimTeamFees(
  termId: string,
): Promise<SwimTeamFeeTier[]> {
  const res = await clientFetch(`/swim-team/seasons/${termId}/fees`, {
    cache: "no-store",
  });
  return res.json();
}

export async function updateSwimTeamFees(
  termId: string,
  tiers: SwimTeamFeeTier[],
): Promise<SwimTeamFeeTier[]> {
  const res = await clientFetch(`/swim-team/seasons/${termId}/fees`, {
    method: "PUT",
    body: JSON.stringify({ tiers }),
  });
  return res.json();
}

export async function getStudentSwimTeamRegistrations(
  studentId: string,
): Promise<SwimTeamRegistration[]> {
  const res = await clientFetch(
    `/swim-team/registrations?studentId=${encodeURIComponent(studentId)}`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function getUninvoicedSwimTeamRegistrations(
  guardianId: string,
): Promise<UninvoicedSwimTeamRegistration[]> {
  const res = await clientFetch(
    `/swim-team/registrations/uninvoiced?guardianId=${encodeURIComponent(guardianId)}`,
    { cache: "no-store", skipLocationHeader: true },
  );
  return res.json();
}

export async function createSwimTeamRegistration(payload: {
  studentId: string;
  termId: string;
  frequency: number;
  competing: boolean;
  offeringIds: string[];
  startDate?: string;
  notes?: string;
}): Promise<SwimTeamRegistration> {
  const res = await clientFetch(`/swim-team/registrations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateSwimTeamRegistration(
  id: string,
  payload: {
    frequency?: number;
    competing?: boolean;
    offeringIds?: string[];
    notes?: string | null;
  },
): Promise<{
  registration: SwimTeamRegistration;
  feeSuggestion: SwimTeamFeeSuggestion;
}> {
  const res = await clientFetch(`/swim-team/registrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function withdrawSwimTeamRegistration(
  id: string,
): Promise<SwimTeamRegistration> {
  const res = await clientFetch(`/swim-team/registrations/${id}/withdraw`, {
    method: "POST",
  });
  return res.json();
}
