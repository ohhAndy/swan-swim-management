import { Instructor } from "./instructors";
import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export interface InstructorAssignment {
  id: string;
  classOfferingId: string;
  instructorId: string;
  assignedAt: string;
  assignedBy: string | null;
  removedAt: string | null;
  removedBy: string | null;
  instructor: Instructor;
}

export async function assignInstructor(
  classOfferingId: string,
  instructorId: string
): Promise<InstructorAssignment> {
  const headers = await getHeaders();

  const response = await fetch(`${API}/class-instructors`, {
    method: "POST",
    headers,
    body: JSON.stringify({ classOfferingId, instructorId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to assign instructor");
  }

  return response.json();
}

export async function removeInstructor(
  assignmentId: string
): Promise<InstructorAssignment> {
  const headers = await getHeaders();

  const response = await fetch(`${API}/class-instructors/${assignmentId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove instructor");
  }

  return response.json();
}

export async function getActiveInstructors(
  classOfferingId: string
): Promise<InstructorAssignment[]> {
  const headers = await getHeaders();

  const response = await fetch(
    `${API}/class-instructors/class/${classOfferingId}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch instructors");
  }

  return response.json();
}
