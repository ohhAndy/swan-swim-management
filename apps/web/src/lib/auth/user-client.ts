export interface CurrentUser {
  authId: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "supervisor" | "viewer";
  active: boolean;
  staffUserId: string;
}

// Client-side version (for client components)
export async function getCurrentUserClient() {
  const res = await fetch("/api/auth/me", {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<CurrentUser>;
}
