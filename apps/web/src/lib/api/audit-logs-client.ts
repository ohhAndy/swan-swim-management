import { getHeaders } from "./headers";

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

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getAuditLogs(
  page = 1,
  limit = 20,
  filters?: {
    action?: string;
    entityType?: string;
    staffId?: string;
  },
): Promise<{ data: AuditLog[]; total: number }> {
  const headers = await getHeaders();
  const searchParams = new URLSearchParams({
    skip: ((page - 1) * limit).toString(),
    take: limit.toString(),
  });

  if (filters?.action) searchParams.set("action", filters.action);
  if (filters?.entityType) searchParams.set("entityType", filters.entityType);
  if (filters?.staffId) searchParams.set("staffId", filters.staffId);

  const res = await fetch(`${API}/audit-logs?${searchParams.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return res.json();
}
