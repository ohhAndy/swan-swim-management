import { clientFetch } from "../_fetch/client";
import type { ReportCard, ReportCardSkill } from "../../types/models";
export type { ReportCard, ReportCardSkill };

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
  options: { force?: boolean } = {},
): Promise<{ success: boolean; attempt: number; communicationLogId: string }> {
  const res = await clientFetch(`/report-cards/${id}/email`, {
    method: "POST",
    body: JSON.stringify({ pdfContent, force: options.force ?? false }),
  });
  return res.json();
}
