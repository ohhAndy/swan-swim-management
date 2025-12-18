import { createClient } from "../supabase/client";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export interface InstructorAssignment {
  id: string;
  classOfferingId: string;
  staffUserId: string;
  assignedAt: string;
  assignedBy: string | null;
  removedAt: string | null;
  removedBy: string | null;
  staffUser: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
}

export async function assignInstructor(
  classOfferingId: string,
  staffUserId: string
): Promise<InstructorAssignment> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API}/class-instructors`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ classOfferingId, staffUserId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign instructor');
  }

  return response.json();
}

export async function removeInstructor(assignmentId: string): Promise<InstructorAssignment> {
  
  const headers = await getAuthHeaders();

  const response = await fetch(`${API}/class-instructors/${assignmentId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove instructor');
  }

  return response.json();
}

export async function getActiveInstructors(
  classOfferingId: string
): Promise<InstructorAssignment[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API}/class-instructors/class/${classOfferingId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch instructors');
  }

  return response.json();
}

export async function getStaffUsers(): Promise<Array<{
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
}>> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API}/staff-users`, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, response.statusText, errorText);
    throw new Error(`Failed to enroll student: ${response.status} - ${errorText}`);
  }

  return response.json();
}