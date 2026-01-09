import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CurrentUser } from "./user-client";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type { CurrentUser };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get Supabase user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch staff user from your backend
    const res = await fetch(`${API}/staff-users/by-auth/${user.id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.log(await res.text());
      console.error("Failed to fetch staff user");
      return null;
    }

    const staffUser = await res.json();

    if (!staffUser.active) {
      return null;
    }

    return {
      authId: user.id,
      email: staffUser.email,
      fullName: staffUser.fullName,
      role: staffUser.role,
      active: staffUser.active,
      staffUserId: staffUser.id,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
