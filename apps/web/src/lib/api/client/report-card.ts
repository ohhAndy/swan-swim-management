import { clientFetch } from "../_fetch/client";
import { Level } from "./curriculum";

export interface ReportCardSkill {
  id: string;
  reportCardId: string;
  skillId: string;
  status: "not_started" | "developing" | "mastered";
  skill: {
    id: string;
    description: string;
    order: number;
    levelId: string;
  };
}

export interface ReportCard {
  id: string;
  enrollmentId: string;
  levelId: string | null;
  status: "draft" | "completed" | "did_not_pass" | "sent";
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  createdByUser?: { fullName: string } | null;
  updatedBy?: string | null;
  updatedByUser?: { fullName: string } | null;
  sentAt?: string | null;
  sentById?: string | null;
  sentByUser?: { fullName: string } | null;
  level: Level | null;
  reportCardSkills: ReportCardSkill[];
}

export interface CreateReportCardDto {
  enrollmentId: string;
  levelId: string;
  status?: "draft" | "completed" | "did_not_pass" | "sent";
  comments?: string;
  skills?: {
    skillId: string;
    status: "not_started" | "developing" | "mastered";
  }[];
}

export interface UpdateReportCardDto {
  enrollmentId?: string;
  levelId?: string;
  status?: "draft" | "completed" | "did_not_pass" | "sent";
  comments?: string;
  skills?: {
    skillId: string;
    status: "not_started" | "developing" | "mastered";
  }[];
}

export async function getReportCards(): Promise<ReportCard[]> {
  const res = await clientFetch(`/report-cards`);
  return res.json();
}

export async function getReportCard(id: string): Promise<ReportCard> {
  const res = await clientFetch(`/report-cards/${id}`);
  return res.json();
}

export async function createReportCard(
  data: CreateReportCardDto,
): Promise<ReportCard> {
  const res = await clientFetch(`/report-cards`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateReportCard(
  id: string,
  data: UpdateReportCardDto,
): Promise<ReportCard> {
  const res = await clientFetch(`/report-cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sendEmailReportCard(
  id: string,
  pdfContent: string,
): Promise<{ success: boolean }> {
  const res = await clientFetch(`/report-cards/${id}/email`, {
    method: "POST",
    body: JSON.stringify({ pdfContent }),
  });
  return res.json();
}
