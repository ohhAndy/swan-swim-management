import { createClient } from "@/lib/supabase/client";
import { TrialStatus } from "@school/shared-types";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export async function createTrialBooking(payload : {
  classSessionId: string,
  childName: string, 
  childAge: number, 
  parentPhone: string, 
  notes?: string,
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/trial-bookings`, {
    method: 'POST',
    headers, 
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create trial booking');
  }

  return res.json();
}

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus |''
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}/status`, {
     method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(`Failed to update trial status: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function convertTrialToStudent(
  trialId: string,
  studentId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}/convert`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ studentId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to convert trial');
  }

  return res.json();
}

export async function deleteTrialBooking(trialId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/trial-bookings/${trialId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete trial booking');
  }

  return res.json();
}