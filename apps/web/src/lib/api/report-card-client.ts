import { getHeaders } from "./headers";
import { Level } from "./curriculum-client";

const API_Base = process.env.NEXT_PUBLIC_API_URL!;

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
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/report-cards`, { headers });
  if (!res.ok) throw new Error("Failed to fetch report cards");
  return res.json();
}

export async function getReportCard(id: string): Promise<ReportCard> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/report-cards/${id}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch report card");
  return res.json();
}

export async function createReportCard(
  data: CreateReportCardDto,
): Promise<ReportCard> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/report-cards`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create report card");
  return res.json();
}

export async function updateReportCard(
  id: string,
  data: UpdateReportCardDto,
): Promise<ReportCard> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/report-cards/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update report card");
  return res.json();
}

export async function sendEmailReportCard(
  id: string,
  pdfContent: string,
): Promise<{ success: boolean }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/report-cards/${id}/email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ pdfContent }),
  });
  if (!res.ok) throw new Error("Failed to email report card");
  return res.json();
}
