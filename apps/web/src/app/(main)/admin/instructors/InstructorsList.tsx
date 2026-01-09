"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInstructors, type Instructor } from "@/lib/api/instructors";

export default function InstructorsList() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstructors().then((data) => {
      setInstructors(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading instructors...</div>;
  }

  if (instructors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        No instructors found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructors.map((instructor) => (
            <TableRow key={instructor.id}>
              <TableCell className="font-medium">
                {instructor.firstName} {instructor.lastName}
              </TableCell>
              <TableCell>{instructor.email || "-"}</TableCell>
              <TableCell>{instructor.phone || "-"}</TableCell>
              <TableCell>
                <Badge variant={instructor.isActive ? "default" : "secondary"}>
                  {instructor.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/admin/instructors/${instructor.id}`}>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
