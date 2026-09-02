"use client";

import Link from "next/link";
import { Trash2, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";
import { StaffRole } from "@/lib/auth/permissions";
import { getInvoiceStatusBadge, canViewReportCard } from "./student-view.utils";
import type { Enrollment, Student } from "@/lib/types/models";

interface StudentEnrollmentCardProps {
  enrollment: Enrollment;
  student: Student;
  userRole: StaffRole;
  staffUserId?: string;
  isCurrent: boolean;
  onTransfer: (enrollment: Enrollment) => void;
  onManageSkips: (enrollment: Enrollment) => void;
  onDelete: (enrollmentId: string) => void;
  onViewReportCard: (enrollment: Enrollment, instructorNames: string) => void;
  onGrantTokens?: (enrollment: Enrollment) => void;
}

export function StudentEnrollmentCard({
  enrollment,
  student,
  userRole,
  staffUserId,
  isCurrent,
  onTransfer,
  onManageSkips,
  onDelete,
  onViewReportCard,
  onGrantTokens,
}: StudentEnrollmentCardProps) {
  const instructors = enrollment.offering.instructors || [];
  const instructorNames = instructors
    .map((i) =>
      i.instructor
        ? `${i.instructor.firstName} ${i.instructor.lastName}`
        : (i.staffUser?.fullName ?? "Unknown"),
    )
    .join(", ");

  const badge = getInvoiceStatusBadge(enrollment, userRole);
  const isSupervisorOrAbove = [
    "super_admin",
    "admin",
    "manager",
    "supervisor",
  ].includes(userRole);

  const termMakeups = (student.makeUps || []).filter(
    (m) => m.classSession.offering.termId === enrollment.offering.termId,
  );

  const scheduleSlotLink = `/term/${enrollment.offering.termId}/schedule/weekday/${enrollment.offering.weekday}/slot/${enrollment.offering.startTime}-${enrollment.offering.endTime}?highlight=${enrollment.offering.id}`;

  if (isCurrent) {
    return (
      <div className="p-4 border rounded-lg bg-green-50">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-medium">
              <Link
                href={scheduleSlotLink}
                className="hover:underline text-blue-600"
              >
                {enrollment.offering.title}
              </Link>
            </h4>
            <p className="text-sm font-medium">
              {enrollment.offering.term.name} •{" "}
              {enrollment.offering.term.location?.name ?? "Unknown Location"}
            </p>

            <p className="text-sm text-gray-600 pt-2">
              {FULL_DAY_LABELS[enrollment.offering.weekday ?? 0]}{" "}
              {enrollment.offering.startTime}-{enrollment.offering.endTime} (
              {enrollment.classRatio})
            </p>

            {instructors.length > 0 ? (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Instructor:</span>{" "}
                {instructorNames}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic mt-1">
                No instructor assigned
              </p>
            )}

            <p className="text-sm text-gray-500 mt-1">
              {new Date(enrollment.enrollDate).toLocaleDateString("en-CA")}
            </p>

            {/* Transfer Information */}
            {enrollment.transferredFrom && (
              <p className="text-sm text-amber-600 mt-1">
                Transferred from:{" "}
                <span className="font-medium">
                  {enrollment.transferredFrom.offering.title}
                </span>{" "}
                ({enrollment.transferredFrom.offering.term.name})
              </p>
            )}
            {enrollment.transferredTo && (
              <p className="text-sm text-blue-600 mt-1">
                Transferred to:{" "}
                <span className="font-medium">
                  {enrollment.transferredTo.offering.title}
                </span>{" "}
                ({enrollment.transferredTo.offering.term.name})
              </p>
            )}

            {/* Report Cards */}
            {enrollment.reportCards && enrollment.reportCards.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200">
                {enrollment.reportCards.map((rc) => {
                  const showLink =
                    isSupervisorOrAbove &&
                    canViewReportCard(rc, userRole, staffUserId);
                  return (
                    <div
                      key={rc.id}
                      className="text-sm flex flex-col gap-0.5 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          Report Card:
                        </span>
                        <span className="text-gray-900">
                          {rc.level?.name || "Unknown Level"}
                        </span>
                        {showLink ? (
                          <button
                            onClick={() =>
                              onViewReportCard(enrollment, instructorNames)
                            }
                            className="hover:opacity-80 transition-opacity focus:outline-none"
                            title="Click to view/edit report card"
                          >
                            <Badge
                              variant={
                                rc.status === "completed"
                                  ? "default"
                                  : rc.status === "did_not_pass"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[10px] py-0 h-4 px-1.5 capitalize cursor-pointer"
                            >
                              {rc.status.replace(/_/g, " ")}
                            </Badge>
                          </button>
                        ) : (
                          <Badge
                            variant={
                              rc.status === "completed"
                                ? "default"
                                : rc.status === "did_not_pass"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px] py-0 h-4 px-1.5 capitalize"
                          >
                            {rc.status.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal pl-0.5">
                        Created by: {rc.createdByUser?.fullName || "Unknown"} •
                        Last updated: {new Date(rc.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Makeups */}
            {termMakeups.length > 0 && (
              <div className="mt-4 pt-3 border-t border-green-200">
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-800">
                  <span className="bg-green-200 p-0.5 rounded text-xs">
                    Makeups
                  </span>
                </h5>
                <div className="flex flex-col gap-2">
                  {termMakeups.map((m) => (
                    <div
                      key={m.id}
                      className="text-sm border border-green-200 bg-white/50 rounded px-2 py-1.5 flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {new Date(m.classSession.date).toLocaleDateString(
                            "en-CA",
                            {
                              timeZone: "UTC",
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            },
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {m.classSession.offering.title} (
                          {m.classSession.offering.startTime})
                        </span>
                      </div>
                      <span
                        title={m.status}
                        className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-gray-200 font-bold ${
                          m.status === "scheduled"
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : m.status === "attended"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : m.status === "requested"
                                ? "bg-orange-100 text-orange-700 border-orange-300"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-4 min-w-[120px]">
            {badge}
            <PermissionGate
              allowedRoles={["super_admin", "admin", "manager"]}
              currentRole={userRole}
            >
              <div className="flex flex-col gap-2">
                <PermissionGate
                  allowedRoles={["super_admin", "admin"]}
                  currentRole={userRole}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGrantTokens?.(enrollment)}
                    className="bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <TicketPlus className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Add Tokens
                  </Button>
                </PermissionGate>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTransfer(enrollment)}
                  className="bg-white"
                >
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageSkips(enrollment)}
                  className="bg-white"
                >
                  Skips
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(enrollment.id)}
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 border"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </PermissionGate>
          </div>
        </div>
      </div>
    );
  }

  // Past Enrollment Card
  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between">
        <div>
          <h4 className="font-medium">
            <Link
              href={scheduleSlotLink}
              className="hover:underline text-blue-600"
            >
              {enrollment.offering.title}
            </Link>
          </h4>
          <p className="text-sm text-gray-500">
            {enrollment.offering.term.name} •{" "}
            {enrollment.offering.term.location?.name ?? "Unknown Location"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {FULL_DAY_LABELS[enrollment.offering.weekday ?? 0]}{" "}
            {enrollment.offering.startTime}–{enrollment.offering.endTime}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Status:{" "}
            <span className="capitalize text-gray-900 font-medium">
              {enrollment.status}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(enrollment.enrollDate).toLocaleDateString()}
          </p>

          {/* Report Cards */}
          {enrollment.reportCards && enrollment.reportCards.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              {enrollment.reportCards.map((rc) => {
                const showLink =
                  isSupervisorOrAbove &&
                  canViewReportCard(rc, userRole, staffUserId);
                return (
                  <div
                    key={rc.id}
                    className="text-sm flex flex-col gap-0.5 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-600">
                        Report Card:
                      </span>
                      <span className="text-gray-800">
                        {rc.level?.name || "Unknown Level"}
                      </span>
                      {showLink ? (
                        <button
                          onClick={() =>
                            onViewReportCard(enrollment, instructorNames)
                          }
                          className="hover:opacity-80 transition-opacity focus:outline-none"
                          title="Click to view/edit report card"
                        >
                          <Badge
                            variant={
                              rc.status === "completed"
                                ? "default"
                                : rc.status === "did_not_pass"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px] py-0 h-4 px-1.5 capitalize cursor-pointer"
                          >
                            {rc.status.replace(/_/g, " ")}
                          </Badge>
                        </button>
                      ) : (
                        <Badge
                          variant={
                            rc.status === "completed"
                              ? "default"
                              : rc.status === "did_not_pass"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px] py-0 h-4 px-1.5 capitalize"
                        >
                          {rc.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-normal pl-0.5">
                      Created by: {rc.createdByUser?.fullName || "Unknown"} • Last
                      updated: {new Date(rc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {badge}
          <PermissionGate
            allowedRoles={["super_admin", "admin"]}
            currentRole={userRole}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageSkips(enrollment)}
              className="bg-white"
            >
              Edit Skips
            </Button>
          </PermissionGate>
        </div>
      </CardContent>
    </Card>
  );
}
