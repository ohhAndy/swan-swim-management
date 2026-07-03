import { clientFetch } from "../_fetch/client";

export interface AuditLog {
  id: string;
  staffId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  staff: {
    fullName: string;
    email: string;
    role: string;
  };
}

export async function getAuditLogs(
  page = 1,
  limit = 20,
  filters?: {
    action?: string;
    entityType?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<{ data: AuditLog[]; total: number }> {
  const searchParams = new URLSearchParams({
    skip: ((page - 1) * limit).toString(),
    take: limit.toString(),
  });

  if (filters?.action) searchParams.set("action", filters.action);
  if (filters?.entityType) searchParams.set("entityType", filters.entityType);
  if (filters?.staffId) searchParams.set("staffId", filters.staffId);
  if (filters?.startDate) searchParams.set("startDate", filters.startDate);
  if (filters?.endDate) searchParams.set("endDate", filters.endDate);

  const res = await clientFetch(`/audit-logs?${searchParams.toString()}`, {
    cache: "no-store",
  });

  return res.json();
}
