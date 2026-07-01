"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEVEL_MAP } from "@/lib/constants/levels";
import { getLevels, Level } from "@/lib/api/curriculum-client";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import RemarksDialog from "./RemarksDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportCardForm } from "../report-cards/ReportCardForm";
import { StaffRole } from "@/lib/auth/permissions";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarClock, CalendarX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type RosterItem = {
  id: string; // EnrollmentID, MakeupID, or TrialID
  type: "student" | "makeup" | "trial";
  name: string;
  studentId: string | null;
  level: string | null;
  age: number | null;
  status: string | null;
  ratio: string | null;
  notes: string | null;
  isSkipped: boolean;
  reportCardStatus: string | null;
  nextTermStatus: "not_registered" | "enrolled" | "paid" | null;
  normalSession?: string | null;
  attendanceCount?: number | null;
  totalSessionsCount?: number | null;
  attendanceTimeline?:
    | {
        date: string;
        status:
          | "present"
          | "absent"
          | "excused"
          | "skipped"
          | "unmarked"
          | "upcoming";
        isCurrent: boolean;
      }[]
    | null;
  enrollmentStatus?: string;
};

type Props = {
  roster: RosterItem[];
  onLevelUpdate?: (
    studentId: string,
    levelId: string,
    levelName: string,
  ) => Promise<void>;
  onAttendanceUpdate?: (item: RosterItem, status: string) => Promise<void>;
  onRemarksUpdate?: (item: RosterItem, remarks: string) => Promise<void>;
  onReportCardUpdate?: (enrollmentId: string, status: string) => Promise<void>;
  userRole: StaffRole;
  termName?: string;
  instructorName?: string;
};

export function DailyClassRoster({
  roster,
  onLevelUpdate,
  onAttendanceUpdate,
  onRemarksUpdate,
  onReportCardUpdate,
  userRole,
  termName,
  instructorName,
}: Props) {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeReportCardEnrollment, setActiveReportCardEnrollment] =
    useState<RosterItem | null>(null);

  useEffect(() => {
    getLevels().then(setLevels);
  }, []);

  const groupedLevels = levels.reduce(
    (acc, lvl) => {
      const category = lvl.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(lvl);
      return acc;
    },
    {} as Record<string, Level[]>,
  );

  const handleLevelUpdate = async (
    studentId: string,
    levelId: string,
    levelName: string,
  ) => {
    if (!onLevelUpdate) return;
    setUpdating(`level-${studentId}`);
    try {
      await onLevelUpdate(studentId, levelId, levelName);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update level");
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusUpdate = async (item: RosterItem, status: string) => {
    if (!onAttendanceUpdate) return;
    setUpdating(`status-${item.id}`);
    try {
      await onAttendanceUpdate(item, status);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemarksSave = async (item: RosterItem, text: string) => {
    if (!onRemarksUpdate) return;
    await onRemarksUpdate(item, text);
  };

  return (
    <div className="space-y-4">
      {/* Mobile Card View (Visible on small screens, hidden on md+) */}
      <div className="md:hidden space-y-3">
        {roster.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm",
              item.isSkipped && "opacity-60 bg-muted",
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="font-semibold text-base flex items-center gap-2">
                  {item.type === "student" && item.studentId ? (
                    <Link
                      href={`/students/${item.studentId}`}
                      className={`hover:underline ${item.enrollmentStatus !== "active" ? "text-muted-foreground line-through" : ""}`}
                      title={
                        item.enrollmentStatus !== "active"
                          ? `(${item.enrollmentStatus})`
                          : ""
                      }
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span
                      className={
                        item.enrollmentStatus !== "active"
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {item.name}
                    </span>
                  )}
                  {item.type === "makeup" && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      Makeup
                    </Badge>
                  )}
                  {item.type === "trial" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      Trial
                    </Badge>
                  )}
                  {/* Next Term Status Icons (Mobile) */}
                  {item.type === "student" &&
                    (userRole === "super_admin" ||
                      userRole === "admin" ||
                      userRole === "manager" ||
                      userRole === "supervisor") &&
                    item.nextTermStatus === "paid" && (
                      <CalendarCheck className="w-4 h-4 text-green-600 ml-1" />
                    )}
                  {item.type === "student" &&
                    (userRole === "super_admin" ||
                      userRole === "admin" ||
                      userRole === "manager" ||
                      userRole === "supervisor") &&
                    item.nextTermStatus === "enrolled" && (
                      <CalendarClock className="w-4 h-4 text-orange-500 ml-1" />
                    )}
                  {/* Report Card Badge (Mobile) */}
                  {item.type === "student" && (
                    <div className="ml-auto">
                      <Badge
                        onClick={() => setActiveReportCardEnrollment(item)}
                        variant="outline"
                        className={cn(
                          "text-[10px] h-5 cursor-pointer ml-1 transition-colors hover:opacity-90",
                          item.reportCardStatus === "completed" ||
                            item.reportCardStatus === "sent" ||
                            item.reportCardStatus === "given"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : item.reportCardStatus === "created" ||
                              item.reportCardStatus === "draft"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : item.reportCardStatus === "did_not_pass"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {item.reportCardStatus === "completed"
                          ? "RC Completed"
                          : item.reportCardStatus === "sent"
                            ? "RC Sent"
                            : item.reportCardStatus === "given"
                              ? "RC Given"
                              : item.reportCardStatus === "created" ||
                                item.reportCardStatus === "draft"
                                ? "RC Draft"
                                : item.reportCardStatus === "did_not_pass"
                                  ? "RC Fail"
                                  : "No RC"}
                      </Badge>
                    </div>
                  )}
                  {/* Normal Session for Makeup (Mobile) */}
                  {item.type === "makeup" && item.normalSession && (
                    <div className="ml-auto">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {item.normalSession}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.age ? `${item.age} yrs` : "Age N/A"} •{" "}
                  {item.ratio || "3:1"}
                </div>
                {item.type === "student" &&
                  item.attendanceTimeline &&
                  item.attendanceTimeline.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {item.attendanceTimeline.map((slot, idx) => {
                        let dotClass =
                          "w-2.5 h-2.5 rounded-full border transition-all duration-150";
                        let label = `${slot.date}: `;
                        if (slot.status === "present") {
                          dotClass += " bg-green-500 border-green-600";
                          label += "Present";
                        } else if (slot.status === "absent") {
                          dotClass += " bg-red-500 border-red-600";
                          label += "Absent";
                        } else if (slot.status === "excused") {
                          dotClass += " bg-yellow-500 border-yellow-600";
                          label += "Excused";
                        } else if (slot.status === "skipped") {
                          dotClass +=
                            " bg-gray-800 border-black line-through opacity-70";
                          label += "Skipped";
                        } else if (slot.status === "upcoming") {
                          dotClass +=
                            " bg-transparent border-gray-300 border-dashed";
                          label += "Upcoming";
                        } else {
                          dotClass += " bg-gray-200 border-gray-300";
                          label += "Not Marked";
                        }

                        if (slot.isCurrent) {
                          dotClass +=
                            " ring-1 ring-primary ring-offset-1 scale-110";
                          label += " (Today)";
                        }

                        return (
                          <TooltipProvider key={idx}>
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <span className={dotClass} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <span className="text-xs font-medium">
                                  {label}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  )}
              </div>

              {/* Level Badge (Editable) */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={
                    !onLevelUpdate ||
                    item.type === "trial" ||
                    updating !== null ||
                    (item.type === "student" &&
                      item.enrollmentStatus !== "active" &&
                      userRole !== "admin" &&
                      userRole !== "super_admin")
                  }
                >
                  <Badge
                    variant={item.level ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer hover:bg-primary/90 transition-colors",
                      !item.level && "text-muted-foreground",
                    )}
                  >
                    {item.level
                      ? LEVEL_MAP.get(item.level) || item.level
                      : "No Level"}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(groupedLevels).map(
                    ([category, catLevels]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {category}
                        </div>
                        {catLevels.map((lvl) => (
                          <DropdownMenuItem
                            key={lvl.id}
                            onSelect={() =>
                              item.studentId &&
                              handleLevelUpdate(
                                item.studentId,
                                lvl.id,
                                lvl.name,
                              )
                            }
                          >
                            <span
                              className={cn(
                                "mr-2",
                                item.level === lvl.name && "font-bold",
                              )}
                            >
                              {lvl.name}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {/* Attendance Action */}
              <AttendanceButton
                item={item}
                loading={updating === `status-${item.id}`}
                onUpdate={(s) => handleStatusUpdate(item, s)}
              />

              <div className="flex-1"></div>

              {/* Remarks */}
              {item.type === "student" || item.type === "makeup" ? (
                <RemarksDialog
                  title={`${item.name} Remarks`}
                  initialRemarks={item.notes}
                  onSave={(t) => handleRemarksSave(item, t)}
                  trigger={
                    item.notes ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-yellow-600"
                      >
                        <span className="sr-only">Remarks</span>
                        <HelpCircle className="h-4 w-4 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground opacity-50 hover:opacity-100"
                      >
                        <span className="sr-only">Add Note</span>
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="w-8"></div>
              )}
            </div>
          </div>
        ))}
        {roster.length === 0 && (
          <div className="text-center text-muted-foreground p-4">
            No students in this class.
          </div>
        )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left font-medium">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3 w-20">Age</th>
              <th className="p-3 w-24">Ratio</th>
              <th className="p-3 w-32">Level</th>
              <th className="p-3 w-28 text-center">Card</th>
              <th className="p-3 w-40 text-center">Status</th>
              <th className="p-3 w-16 text-center">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roster.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  item.isSkipped && "bg-gray-50 opacity-60",
                )}
              >
                <td className="p-3">
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center gap-2">
                      {item.type === "student" && item.studentId ? (
                        <Link
                          href={`/students/${item.studentId}`}
                          className={`hover:underline ${item.enrollmentStatus !== "active" ? "text-muted-foreground line-through" : "text-blue-600"}`}
                          title={
                            item.enrollmentStatus !== "active"
                              ? `(${item.enrollmentStatus})`
                              : ""
                          }
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span
                          className={
                            item.enrollmentStatus !== "active"
                              ? "text-muted-foreground line-through"
                              : ""
                          }
                        >
                          {item.name}
                        </span>
                      )}
                      {item.type === "makeup" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1"
                        >
                          Makeup
                        </Badge>
                      )}
                      {item.type === "trial" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 bg-purple-50 text-purple-700"
                        >
                          Trial
                        </Badge>
                      )}
                      {item.type === "student" &&
                        (userRole === "super_admin" ||
                          userRole === "admin" ||
                          userRole === "manager" ||
                          userRole === "supervisor") &&
                        item.nextTermStatus === "paid" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex ml-1 items-center justify-center">
                                  <CalendarCheck className="w-4 h-4 text-green-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Next Term: Paid</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      {item.type === "student" &&
                        (userRole === "super_admin" ||
                          userRole === "admin" ||
                          userRole === "manager" ||
                          userRole === "supervisor") &&
                        item.nextTermStatus === "enrolled" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex ml-1 items-center justify-center">
                                  <CalendarClock className="w-4 h-4 text-orange-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Next Term: Enrolled (Unpaid)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      {item.type === "student" &&
                        (userRole === "super_admin" ||
                          userRole === "admin" ||
                          userRole === "manager" ||
                          userRole === "supervisor") &&
                        (!item.nextTermStatus ||
                          item.nextTermStatus === "not_registered") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex ml-1 items-center justify-center opacity-20">
                                  <CalendarX className="w-4 h-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Next Term: Not Registered</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                    </div>
                    {item.type === "student" &&
                      item.attendanceTimeline &&
                      item.attendanceTimeline.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {item.attendanceTimeline.map((slot, idx) => {
                            let dotClass =
                              "w-2 h-2 rounded-full border transition-all duration-150";
                            let label = `${slot.date}: `;
                            if (slot.status === "present") {
                              dotClass += " bg-green-500 border-green-600";
                              label += "Present";
                            } else if (slot.status === "absent") {
                              dotClass += " bg-red-500 border-red-600";
                              label += "Absent";
                            } else if (slot.status === "excused") {
                              dotClass += " bg-yellow-500 border-yellow-600";
                              label += "Excused";
                            } else if (slot.status === "skipped") {
                              dotClass +=
                                " bg-gray-800 border-black line-through opacity-70";
                              label += "Skipped";
                            } else if (slot.status === "upcoming") {
                              dotClass +=
                                " bg-transparent border-gray-300 border-dashed";
                              label += "Upcoming";
                            } else {
                              dotClass += " bg-gray-200 border-gray-300";
                              label += "Not Marked";
                            }

                            if (slot.isCurrent) {
                              dotClass +=
                                " ring-1 ring-primary ring-offset-1 scale-125";
                              label += " (Today)";
                            }

                            return (
                              <TooltipProvider key={idx}>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <span className={dotClass} />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="text-xs font-medium">
                                      {label}
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </td>
                <td className="p-3">{item.age}</td>
                <td className="p-3">{item.ratio || "3:1"}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      disabled={
                        !onLevelUpdate ||
                        item.type === "trial" ||
                        updating !== null ||
                        (item.type === "student" &&
                          item.enrollmentStatus !== "active" &&
                          userRole !== "admin" &&
                          userRole !== "super_admin")
                      }
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-normal justify-start px-2 w-full text-left"
                      >
                        {item.level ? (
                          LEVEL_MAP.get(item.level) || item.level
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(groupedLevels).map(
                        ([category, catLevels]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {category}
                            </div>
                            {catLevels.map((lvl) => (
                              <DropdownMenuItem
                                key={lvl.id}
                                onSelect={() =>
                                  item.studentId &&
                                  handleLevelUpdate(
                                    item.studentId,
                                    lvl.id,
                                    lvl.name,
                                  )
                                }
                              >
                                <span
                                  className={cn(
                                    "mr-2",
                                    item.level === lvl.name && "font-bold",
                                  )}
                                >
                                  {lvl.name}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="p-3 text-center">
                  {item.type === "student" ? (
                    <button
                      onClick={() => setActiveReportCardEnrollment(item)}
                      className={cn(
                        "text-xs px-2 py-1 rounded border min-w-[80px] font-medium transition-colors hover:opacity-90",
                        item.reportCardStatus === "completed" ||
                          item.reportCardStatus === "sent" ||
                          item.reportCardStatus === "given"
                          ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          : item.reportCardStatus === "created" ||
                            item.reportCardStatus === "draft"
                            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            : item.reportCardStatus === "did_not_pass"
                              ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100",
                      )}
                    >
                      {item.reportCardStatus === "completed"
                        ? "Completed"
                        : item.reportCardStatus === "sent"
                          ? "Sent"
                          : item.reportCardStatus === "given"
                            ? "Given"
                            : item.reportCardStatus === "created" ||
                              item.reportCardStatus === "draft"
                              ? "Draft"
                              : item.reportCardStatus === "did_not_pass"
                                ? "Did Not Pass"
                                : "None"}
                    </button>
                  ) : item.type === "makeup" && item.normalSession ? (
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded">
                      {item.normalSession}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center">
                    <AttendanceButton
                      item={item}
                      loading={updating === `status-${item.id}`}
                      onUpdate={(s) => handleStatusUpdate(item, s)}
                      userRole={userRole}
                    />
                  </div>
                </td>
                <td className="p-3 text-center">
                  {item.type === "student" || item.type === "makeup" ? (
                    <RemarksDialog
                      title={`${item.name} Remarks`}
                      initialRemarks={item.notes}
                      onSave={(t) => handleRemarksSave(item, t)}
                      trigger={
                        item.notes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            Edit/View Remarks
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground opacity-50 hover:opacity-100"
                          >
                            Edit/View Remarks
                          </Button>
                        )
                      }
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs text-center block">
                      -
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  No students scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog for Report Card Form */}
      {activeReportCardEnrollment && (
        <Dialog
          open={activeReportCardEnrollment !== null}
          onOpenChange={(open) => !open && setActiveReportCardEnrollment(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Report Card</DialogTitle>
            <ReportCardForm
              enrollmentId={activeReportCardEnrollment.id}
              studentLevelId={
                levels.find((l) => l.name === activeReportCardEnrollment.level)
                  ?.id || undefined
              }
              studentName={activeReportCardEnrollment.name}
              termName={termName || "Current Term"}
              instructorName={instructorName || "No Instructor"}
              userRole={userRole}
              onClose={() => {
                setActiveReportCardEnrollment(null);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AttendanceButton({
  item,
  loading,
  onUpdate,
  userRole,
}: {
  item: RosterItem;
  loading: boolean;
  onUpdate: (s: string) => void;
  userRole?: string;
}) {
  // Determine current status label/color
  let label = "Mark";
  let variant: "default" | "outline" | "ghost" | "secondary" | "destructive" =
    "outline";
  let className = "";

  if (item.isSkipped) {
    return (
      <Badge
        variant="secondary"
        className="bg-black text-white hover:bg-black/80"
      >
        Skipped
      </Badge>
    );
  }

  if (item.type === "student") {
    switch (item.status) {
      case "present":
        label = "Present";
        variant = "default";
        className = "bg-green-600 hover:bg-green-700";
        break;
      case "absent":
        label = "Absent";
        variant = "destructive";
        break;
      case "excused":
        label = "Excused";
        variant = "secondary";
        className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        break;
      default:
        label = "Mark";
        variant = "outline";
        className = "text-muted-foreground border-dashed";
        break;
    }
  } else if (item.type === "makeup") {
    switch (item.status) {
      case "attended":
        label = "Attended";
        variant = "default";
        className = "bg-green-600 hover:bg-green-700";
        break;
      case "scheduled":
        label = "Scheduled";
        variant = "secondary";
        className = "bg-blue-100 text-blue-700";
        break;
      case "missed":
        label = "Missed";
        variant = "destructive";
        break;
      case "cancelled":
        label = "Cancelled";
        variant = "outline";
        className = "text-muted-foreground line-through";
        break;
      default:
        label = item.status || "Status";
        variant = "outline";
        break;
    }
  } else if (item.type === "trial") {
    switch (item.status) {
      case "attended":
        label = "Attended";
        variant = "default";
        className = "bg-green-600 hover:bg-green-700";
        break;
      case "scheduled":
        label = "Scheduled";
        variant = "secondary";
        className = "bg-purple-100 text-purple-700";
        break;
      case "noshow":
        label = "No Show";
        variant = "destructive";
        break;
      case "converted":
        label = "Converted";
        variant = "default";
        className = "bg-blue-600";
        break;
      case "cancelled":
        label = "Cancelled";
        variant = "outline";
        className = "text-muted-foreground line-through";
        break;
      default:
        label = item.status || "Status";
        variant = "outline";
        break;
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        disabled={
          loading ||
          item.status === "converted" ||
          (item.type === "student" &&
            item.enrollmentStatus !== "active" &&
            userRole !== "admin" &&
            userRole !== "super_admin")
        }
      >
        <Button
          variant={variant}
          size="sm"
          className={cn(
            "w-24 h-8 text-xs font-semibold shadow-sm transition-all",
            className,
          )}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {item.type === "student" && (
          <>
            <DropdownMenuItem onSelect={() => onUpdate("present")}>
              Present
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("absent")}>
              Absent
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("excused")}>
              Excused
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("")}>
              Clear
            </DropdownMenuItem>
          </>
        )}
        {item.type === "makeup" && (
          <>
            <DropdownMenuItem onSelect={() => onUpdate("attended")}>
              Attended
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("missed")}>
              Missed
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("cancelled")}>
              Cancelled
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("")}>
              Clear (Reset)
            </DropdownMenuItem>
          </>
        )}
        {item.type === "trial" && (
          <>
            <DropdownMenuItem onSelect={() => onUpdate("attended")}>
              Attended
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("noshow")}>
              No Show
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUpdate("cancelled")}>
              Cancelled
            </DropdownMenuItem>
            {/* Converted is handled via a separate flow usually, but could allow manual set here if needed, but risky without student creation flow */}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
