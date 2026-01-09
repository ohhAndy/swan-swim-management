"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InstructorForm from "../InstructorForm";
import { getInstructor, type Instructor } from "@/lib/api/instructors";

export default function EditInstructorPage() {
  const params = useParams();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getInstructor(params.id as string)
        .then(setInstructor)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!instructor) {
    return <div className="container mx-auto py-8">Instructor not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Instructor</h1>
      <InstructorForm instructor={instructor} />
    </div>
  );
}
