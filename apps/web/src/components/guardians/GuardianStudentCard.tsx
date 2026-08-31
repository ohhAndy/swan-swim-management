"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { StaffRole } from "@/lib/auth/permissions";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";
import { calculateAge, getGuardianInvoiceBadge } from "./guardian-view.utils";
import type { GuardianStudentData, EnrollmentData } from "./guardian-view.types";

interface GuardianStudentCardProps {
  student: GuardianStudentData;
  userRole: StaffRole;
  onTransfer: (
    enrollment: EnrollmentData,
    student: { id: string; firstName: string; lastName: string },
  ) => void;
  onManageSkips: (
    enrollment: EnrollmentData,
    student: { id: string; firstName: string; lastName: string },
  ) => void;
  onDelete: (enrollmentId: string) => void;
}

export function GuardianStudentCard({
  student,
  userRole,
  onTransfer,
  onManageSkips,
  onDelete,
}: GuardianStudentCardProps) {
  const activeEnrollments = student.enrollments.filter(
    (e) => e.status === "active",
  );
  const otherEnrollments = student.enrollments.filter(
    (e) => e.status !== "active",
  );

  return (
    <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-sm">
      <CardHeader className="bg-gray-50 pb-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link
                href={`/students/${student.id}`}
                className="hover:text-blue-600 hover:underline"
              >
                {student.firstName} {student.lastName}
              </Link>
            </CardTitle>
            <div className="flex gap-3 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-500 text-xs uppercase">
                  Age:
                </span>{" "}
                {calculateAge(student.birthdate)}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-500 text-xs uppercase">
                  Level:
                </span>{" "}
                <Badge variant="outline" className="text-xs font-normal">
                  {student.level || "N/A"}
                </Badge>
              </span>
            </div>
          </div>
          <Link href={`/students/${student.id}`}>
            <Button size="sm" variant="outline">
              View Profile
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Active Enrollments */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
            Active Enrollments
          </h3>
          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No active enrollments.
            </p>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.map((enrollment) => {
                const instructors = enrollment.offering.instructors || [];
                const instructorNames = instructors
                  .map((i) =>
                    i.instructor
                      ? `${i.instructor.firstName} ${i.instructor.lastName}`
                      : (i.staffUser?.fullName ?? "Unknown"),
                  )
                  .join(", ");
                const invoiceBadge = getGuardianInvoiceBadge(enrollment);

                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-green-50/50 hover:bg-green-50 transition-colors"
                  >
                    <div className="space-y-1 mb-2 sm:mb-0">
                      <div className="font-semibold text-green-900">
                        {enrollment.offering.title}{" "}
                        <span className="text-green-700 font-normal text-sm">
                          ({enrollment.offering.term.name})
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-x-4">
                        <span>
                          {FULL_DAY_LABELS[enrollment.offering.weekday]}{" "}
                          {enrollment.offering.startTime} -{" "}
                          {enrollment.offering.endTime}
                        </span>
                        {instructorNames && (
                          <span className="text-gray-500">
                            w/ {instructorNames}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {invoiceBadge}
                        <span className="text-xs text-gray-400">
                          Ratio: {enrollment.classRatio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PermissionGate
                        allowedRoles={["super_admin", "admin", "manager"]}
                        currentRole={userRole}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-white"
                          onClick={() => onTransfer(enrollment, student)}
                        >
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-white"
                          onClick={() => onManageSkips(enrollment, student)}
                        >
                          Skips
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(enrollment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past/Other Enrollments */}
        {otherEnrollments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Recent Inactive Enrollments
            </h3>
            <div className="grid gap-2">
              {otherEnrollments.slice(0, 3).map((enrollment) => {
                const instructors = enrollment.offering.instructors || [];
                const instructorNames = instructors
                  .map((i) =>
                    i.instructor
                      ? `${i.instructor.firstName} ${i.instructor.lastName}`
                      : (i.staffUser?.fullName ?? "Unknown"),
                  )
                  .join(", ");

                return (
                  <div
                    key={enrollment.id}
                    className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border border-gray-100 opacity-70"
                  >
                    <div className="flex flex-col">
                      <div>
                        <span className="font-medium">
                          {enrollment.offering.title}
                        </span>
                        <span className="text-gray-500 mx-1">•</span>
                        <span className="text-gray-500">
                          {enrollment.offering.term.name}
                        </span>
                      </div>
                      {instructorNames && (
                        <div className="text-xs text-gray-500">
                          Instructor: {instructorNames}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs uppercase scale-90"
                    >
                      {enrollment.status}
                    </Badge>
                  </div>
                );
              })}
              {otherEnrollments.length > 3 && (
                <p className="text-xs text-center text-gray-400 mt-1">
                  +{otherEnrollments.length - 3} more...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
