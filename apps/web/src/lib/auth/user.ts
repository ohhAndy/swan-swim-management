import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/error";
import { CurrentUser } from "./user-client";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type { CurrentUser };

type CurrentUserLookup =
  | { status: "ok"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

interface StaffUserResponse {
  id: string;
  authId: string;
  email: string;
  fullName: string;
  role: CurrentUser["role"];
  active: boolean;
}

export async function lookupCurrentUser(): Promise<CurrentUserLookup> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { status: "unauthenticated" };

  const res = await fetch(`${API}/staff-users/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (res.status === 401) return { status: "unauthenticated" };
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, await res.text());
  }

  const staffUser: StaffUserResponse = await res.json();
  return {
    status: "ok",
    user: {
      authId: staffUser.authId,
      email: staffUser.email,
      fullName: staffUser.fullName,
      role: staffUser.role,
      active: staffUser.active,
      staffUserId: staffUser.id,
    },
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await lookupCurrentUser();
  if (result.status === "forbidden") redirect("/access-denied");
  return result.status === "ok" ? result.user : null;
}
