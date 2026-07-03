import { clientFetch } from "../_fetch/client";

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemData {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  stock: number;
}

export interface UpdateInventoryItemData {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  stock?: number;
  active?: boolean;
}

export interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export async function getInventoryItems(query?: InventoryQuery) {
  const params = new URLSearchParams();
  if (query?.page)
    params.append("skip", String((query.page - 1) * (query.limit || 20)));
  if (query?.limit) params.append("take", String(query.limit));
  if (query?.search) params.append("search", query.search);
  if (query?.active !== undefined)
    params.append("active", String(query.active));

  const res = await clientFetch(`/inventory?${params.toString()}`, {
    cache: "no-store",
  });

  return res.json() as Promise<{
    data: InventoryItem[];
    meta: { total: number; page: number; limit: number };
  }>;
}

export async function getInventoryItem(id: string) {
  const res = await clientFetch(`/inventory/${id}`);
  return res.json();
}

export async function createInventoryItem(data: CreateInventoryItemData) {
  const res = await clientFetch(`/inventory`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateInventoryItem(
  id: string,
  data: UpdateInventoryItemData,
) {
  // Filter out undefined and empty strings if needed, matching logic
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const res = await clientFetch(`/inventory/${id}`, {
    method: "PATCH",
    body: JSON.stringify(cleanData),
  });
  return res.json();
}

export async function deleteInventoryItem(id: string) {
  const res = await clientFetch(`/inventory/${id}`, {
    method: "DELETE",
  });
  return res.json();
}
