import { createClient } from '@/lib/supabase/client';
import { TrialStatus } from '@school/shared-types';

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export async function upsertAttendance(
    enrollmentId: string,
    sessionId: string,
    status: "present" | "absent" | "excused" | "",
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API}/attendance`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ enrollmentId, classSessionId: sessionId, status: status || null }),
    });
    if(!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, res.statusText, errorText);
        throw new Error(`Failed to Upsert Attendance: ${res.status} - ${errorText}`);
    }

    return res.json()
}

export async function updateMakeupStatus(
    makeUpId: string,
    status: "scheduled" | "requested" | "cancelled" | "attended" | "missed" | "",
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API}/attendance/makeup`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ makeUpId, status: status || null }),
    });
    if(!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, res.statusText, errorText);
        throw new Error(`Failed to Upsert Attendance: ${res.status} - ${errorText}`);
    }

    return res.json()
}