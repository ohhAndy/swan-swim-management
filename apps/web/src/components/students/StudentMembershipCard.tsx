"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Plus,
  Settings2,
  Waves,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Student } from "@/lib/types/models";
import { RegisterMembershipDialog } from "./RegisterMembershipDialog";
import { formatCalendarDate } from "@/lib/date";

interface StudentMembershipCardProps {
  student: Student;
  userRole?: string;
}

export function StudentMembershipCard({
  student,
  userRole,
}: StudentMembershipCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Supervisors and above can manage memberships
  const canManage =
    userRole === "super_admin" ||
    userRole === "admin" ||
    userRole === "manager" ||
    userRole === "supervisor";

  // Find most recent or active membership
  const memberships = student.memberships || [];
  const activeMembership =
    memberships.find((m) => m.status === "active") || memberships[0] || null;

  // Practice attendance drop-ins
  const attendances = student.attendances || [];

  // Calculate training volume
  const now = new Date();
  const currentYearMonth = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}`;

  const thisMonthCount = attendances.filter((a) => {
    const sessionDate = a.classSession?.date;
    if (!sessionDate) return false;
    return sessionDate.startsWith(currentYearMonth);
  }).length;

  const totalPracticeCount = attendances.length;

  return (
    <>
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Competitive Swim Team
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Model B • Monthly Practice Drop-In Membership
              </p>
            </div>
          </div>

          {activeMembership && (
            <Badge
              variant={
                activeMembership.status === "active"
                  ? "default"
                  : activeMembership.status === "paused"
                    ? "secondary"
                    : "outline"
              }
              className={
                activeMembership.status === "active"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  : activeMembership.status === "paused"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : ""
              }
            >
              {activeMembership.status.toUpperCase()}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {activeMembership ? (
            <>
              {/* Season & Fee Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-lg border text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Season
                  </span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {activeMembership.seasonTerm?.name || "Competitive Season"}
                  </span>
                  {activeMembership.seasonTerm?.location?.name && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {activeMembership.seasonTerm.location.name}
                      </span>
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">
                    Annual Reg Fee
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {activeMembership.annualRegPaid ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid ($
                        {Number(activeMembership.annualRegFee || 0).toFixed(0)})
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-1.5 py-0"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Unpaid ($
                        {Number(activeMembership.annualRegFee || 0).toFixed(0)})
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">
                    Monthly Practice Fee
                  </span>
                  <span className="font-semibold text-slate-800">
                    $
                    {Number(activeMembership.monthlyPracticeFee || 0).toFixed(
                      2,
                    )}
                    /mo
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">
                    Season Dates
                  </span>
                  <span className="text-xs text-slate-700 block">
                    {activeMembership.startDate
                      ? formatCalendarDate(activeMembership.startDate)
                      : "—"}{" "}
                    to{" "}
                    {activeMembership.endDate
                      ? formatCalendarDate(activeMembership.endDate)
                      : "Ongoing"}
                  </span>
                </div>
              </div>

              {/* Training Volume & Attendance Analytics */}
              <div className="border rounded-lg p-3 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-blue-500" />
                    Practice Attendance & Volume
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Drop-in model (No absences recorded)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-md p-2.5 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {thisMonthCount}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Practices This Month
                    </div>
                  </div>

                  <div className="bg-slate-50 border rounded-md p-2.5 text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      {totalPracticeCount}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Total Season Practices
                    </div>
                  </div>
                </div>

                {/* Recent Practice History */}
                {attendances.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-xs font-medium text-slate-600 mb-2 block">
                      Recent Sessions Attended
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {attendances.slice(0, 4).map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 border text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium">
                              {formatCalendarDate(att.classSession.date)}
                            </span>
                            {att.classSession.startTime && (
                              <span className="text-muted-foreground">
                                {att.classSession.startTime} -{" "}
                                {att.classSession.endTime}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-[11px] truncate max-w-[140px]">
                            {att.classSession.offering?.term?.location?.name ||
                              att.classSession.offering?.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {canManage && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Manage Membership
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 px-4 text-center border rounded-lg border-dashed bg-slate-50/50 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">
                  Not Registered for Swim Team
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This swimmer is currently only in standard term lessons.
                  Registering grants drop-in access to competitive practices and
                  enables monthly billing.
                </p>
              </div>

              {canManage && (
                <Button
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register for Swim Team
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RegisterMembershipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={student}
        existingMembership={activeMembership}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
