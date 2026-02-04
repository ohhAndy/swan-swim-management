import InstructorForm from "../InstructorForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Instructor | Swan Swim Management",
};

export default function NewInstructorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Add New Instructor</h1>
      <InstructorForm />
    </div>
  );
}
