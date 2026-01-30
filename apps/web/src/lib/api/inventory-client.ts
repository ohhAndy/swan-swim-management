import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

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

  const headers = await getHeaders();
  const res = await fetch(`${API}/inventory?${params.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function getInventoryItem(id: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/inventory/${id}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch item");
  return res.json();
}

export async function createInventoryItem(data: CreateInventoryItemData) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/inventory`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create item");
  return res.json();
}

export async function updateInventoryItem(
  id: string,
  data: UpdateInventoryItemData,
) {
  const headers = await getHeaders();

  // Filter out undefined and empty strings if needed, matching logic
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const res = await fetch(`${API}/inventory/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(cleanData),
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function deleteInventoryItem(id: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/inventory/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete item");
  return res.json();
}
