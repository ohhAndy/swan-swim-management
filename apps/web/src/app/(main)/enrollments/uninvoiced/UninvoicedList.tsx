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
import { getAllTerms } from "@/lib/api/schedule-client";
import { Term } from "@school/shared-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TermWithLocation extends Term {
  location?: { name: string };
}

export default function UninvoicedList() {
  const [data, setData] = useState<UninvoicedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<TermWithLocation[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");

  useEffect(() => {
    async function loadTerms() {
      try {
        const allTerms = await getAllTerms();
        setTerms(allTerms);
      } catch (error) {
        console.error("Failed to load terms:", error);
      }
    }
    loadTerms();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await getUninvoicedEnrollments({
          termId: selectedTermId === "all" ? undefined : selectedTermId,
        });
        console.log(res);
        setData(res);
      } catch (error) {
        console.error("Failed to fetch uninvoiced enrollments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedTermId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Uninvoiced Enrollments</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                    {term.location ? ` (${term.location.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No uninvoiced enrollments found. Good job!
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enroll Date</TableHead>
                  <TableHead>Location</TableHead>
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
                    <TableCell>
                      {enrollment.offering.term.location?.name || "N/A"}
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
