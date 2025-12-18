import { createServerSupabaseClient } from '@/lib/supabase/server'

const API = process.env.NEXT_PUBLIC_API_URL!;

export interface CurrentUser {
  authId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'supervisor' | 'viewer';
  active: boolean;
  staffUserId: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get Supabase user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Fetch staff user from your backend
    const res = await fetch(`${API}/staff-users/by-auth/${user.id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.log(await res.text())
      console.error('Failed to fetch staff user');
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
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Client-side version (for client components)
export async function getCurrentUserClient() {
  const res = await fetch('/api/auth/me', {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<CurrentUser>;
}