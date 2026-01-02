"use client";

import { useEffect, useState } from "react";
import {
  getUninvoicedEnrollments,
  UninvoicedEnrollment,
} from "@/lib/api/enrollments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UninvoicedList() {
  const [data, setData] = useState<UninvoicedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getUninvoicedEnrollments();
        console.log(res);
        setData(res);
      } catch (error) {
        console.error("Failed to fetch uninvoiced enrollments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uninvoiced Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No uninvoiced enrollments found. Good job!
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enroll Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Offering</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Guardian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {new Date(enrollment.enrollDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.student.firstName}{" "}
                      {enrollment.student.lastName}
                    </TableCell>
                    <TableCell>
                      {enrollment.student.level} @{" "}
                      {enrollment.offering.startTime} (
                      {
                        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                          enrollment.offering.weekday
                        ]
                      }
                      )
                    </TableCell>
                    <TableCell>{enrollment.offering.term.name}</TableCell>
                    <TableCell>
                      {enrollment.student.guardian.fullName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
