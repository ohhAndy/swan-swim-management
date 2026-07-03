import { type Instructor } from "./instructors";
import { clientFetch } from "../_fetch/client";

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
  const response = await clientFetch(`/class-instructors`, {
    method: "POST",
    body: JSON.stringify({ classOfferingId, instructorId }),
  });
  return response.json();
}

export async function removeInstructor(
  assignmentId: string
): Promise<InstructorAssignment> {
  const response = await clientFetch(`/class-instructors/${assignmentId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function getActiveInstructors(
  classOfferingId: string
): Promise<InstructorAssignment[]> {
  const response = await clientFetch(
    `/class-instructors/class/${classOfferingId}`,
  );
  return response.json();
}
