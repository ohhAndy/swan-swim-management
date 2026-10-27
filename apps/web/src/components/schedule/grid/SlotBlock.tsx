"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StudentGrid } from "./StudentGrid";
import type { RosterResponse } from "@school/shared-types";
import {
  upsertAttendance,
  updateMakeupStatus,
} from "@/lib/api/client/attendance";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  EnrollStudentDialog,
  ScheduleMakeupDialog,
  OfferingInfoDialog as OfferingDialog,
  AssignInstructorDialog,
  ScheduleTrialDialog,
  ConvertTrialDialog,
  PracticeRosterDialog,
} from "../dialogs";
import { CurrentUser } from "@/lib/auth/user";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { updateStudentNotes } from "@/lib/api/client/students";
import { Loader2, Users, Trash2, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateOfferingInfo } from "@/lib/api/client/schedule";
import { updateTrialStatus } from "@/lib/api/client/trial";
import { deleteOffering } from "@/lib/api/client/schedule";
import { useSlotDialogs } from "./useSlotDialogs";
import { toast } from "sonner";

export function SlotBlock({
  title,
  isoDates,
  rosters,
  user,
  termName,
}: {
  title: string;
  isoDates: string[];
  rosters: RosterResponse[];
  user: CurrentUser;
  gridHeaderTop?: string | number;
  termName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [isRefreshing, startTransition] = useTransition();
  const dialogs = useSlotDialogs();
  const [rostersState, setRostersState] = useState(rosters);
  const [practiceRosterOpen, setPracticeRosterOpen] = useState(false);

  const isPracticeOffering = rosters[0]?.session?.offeringType === "practice";

  useEffect(() => {
    setRostersState(rosters);
  }, [rosters]);

  useEffect(() => {
    if (highlightId) {
      // Small timeout to ensure DOM is ready and tabs are rendered
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(`offering-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [highlightId, rosters]);

  const byDate: Record<
    string,
    {
      sessionId: string | null;
      offeringId: string | null;
      filled: number;
      capacity?: number;
    }
  > = {};

  for (const r of rosters) {
    const ymd = r.session.date.slice(0, 10);
    byDate[ymd] = {
      sessionId: r.session.id ?? null,
      offeringId: r.session.offeringId ?? null,
      filled: r.filled ?? 0,
      capacity: r.capacity,
    };
  }

  const fallbackOfferingId = rosters[0]?.session.offeringId;
  // Get instructors from first roster (all rosters have same offering/instructors)
  const instructors = rosters[0]?.session.instructors || [];
  const instructorNames = instructors.map((i) => i.staffName).join(", ");

  const handleAttendanceUpdate = async (
    enrollmentId: string,
    sessionId: string,
    status: string,
  ) => {
    try {
      await upsertAttendance(
        enrollmentId,
        sessionId,
        status as "present" | "absent" | "excused" | "",
      );
    } catch (error) {
      console.error("Failed to upsert attendance:", error);
      throw error;
    }
  };

  const handleMakeUpUpdate = async (makeUpId: string, status: string) => {
    try {
      await updateMakeupStatus(
        makeUpId,
        status as "scheduled" | "attended" | "cancelled" | "requested" | "",
      );
    } catch (error) {
      console.error("Failed to update makeup status:", error);
      throw error;
    }
  };

  const handleTrialUpdate = async (trialId: string, status: string) => {
    try {
      await updateTrialStatus(
        trialId,
        status as
          | "scheduled"
          | "attended"
          | "noshow"
          | "converted"
          | "cancelled"
          | "",
      );
    } catch (error) {
      console.error("Failed to update trial status:", error);
      throw error;
    }
  };

  const handleRemarksUpdate = async (studentId: string, notes: string) => {
    try {
      await updateStudentNotes(studentId, notes);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update student notes:", error);
      throw error; // Re-throw so the dialog can show error state
    }
  };

  const handleOfferingUpdate = async (
    newTitle: string,
    newType?: "regular" | "flexible" | "practice",
  ) => {
    try {
      await updateOfferingInfo(fallbackOfferingId, {
        title: newTitle,
        type: newType,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update offering:", error);
      throw error; // Re-throw so the dialog can show error state
    }
  };


  const handleMakeupClick = (date: string) => {
    dialogs.makeup.open(date);
  };

  const handleTrialClick = (date: string) => {
    // Find the session ID for this date
    const ymd = date.slice(0, 10);
    const sessionId = byDate[ymd]?.sessionId || null;
    dialogs.trial.open(date, sessionId);
  };

  const handleTrialConvert = (trial: {
    id: string;
    childName: string;
    childAge: number;
    parentPhone: string;
  }) => {
    dialogs.convertTrial.open(trial);
  };

  const handleCreateNewStudentFromTrial = (trialInfo: {
    childName: string;
    childAge: number;
    parentPhone: string;
  }) => {
    dialogs.convertTrial.close();

    const parts = trialInfo.childName.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    const params = new URLSearchParams();
    if (firstName) params.set("firstName", firstName);
    if (lastName) params.set("lastName", lastName);

    router.push(`/admin/students/new?${params.toString()}`);
  };

  const handleDialogSuccess = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className="relative z-0 group break-inside-avoid print:mb-5"
      id={fallbackOfferingId ? `offering-${fallbackOfferingId}` : undefined}
    >
      <Card
        className={`print:break-inside-avoid shadow-sm transition-all duration-500 ${
          highlightId === fallbackOfferingId
            ? "ring-2 ring-blue-500 shadow-lg scale-[1.01] bg-blue-100"
            : "bg-white"
        }`}
      >
        <CardHeader className="gap-1 py-2">
          <div className="flex flex-col items-center justify-between gap-2">
            <div className="flex items-center justify-between w-full p-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{title}</CardTitle>
                {isPracticeOffering && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-xs font-semibold">
                    Team Practice
                  </Badge>
                )}
                <OfferingDialog
                  initialTitle={title}
                  initialType={rosters[0]?.session?.offeringType || "regular"}
                  triggerLabel="Edit"
                  onSave={handleOfferingUpdate}
                />
              </div>

              <div className="flex items-center gap-2">
                {isPracticeOffering && (
                  <PermissionGate
                    allowedRoles={["super_admin", "admin", "manager", "supervisor"]}
                    currentRole={user.role}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPracticeRosterOpen(true)}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-medium flex items-center gap-1.5"
                    >
                      <Waves className="h-3.5 w-3.5" />
                      Deck Check-In
                    </Button>
                  </PermissionGate>
                )}

                <PermissionGate
                  allowedRoles={["super_admin", "admin", "manager"]}
                  currentRole={user.role}
                >
                  <Button
                    variant="outline"
                    onClick={dialogs.enroll.open}
                    disabled={!fallbackOfferingId}
                    className="text-xs hover:underline font-medium opacity-70 hover:opacity-100 transition-all"
                  >
                    + Enroll
                  </Button>
                </PermissionGate>
              </div>
            </div>
            <Separator className="bg-black" />
            <div className="flex items-center gap-5 w-full">
              <PermissionGate
                allowedRoles={["super_admin", "admin", "manager", "supervisor"]}
                currentRole={user.role}
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dialogs.instructor.open}
                    disabled={!fallbackOfferingId}
                    className="text-xs bg-[#bce0f7]"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {instructorNames || "No Instructor Assigned"}
                  </Button>

                  {(user.role === "super_admin" ||
                    user.role === "admin" ||
                    user.role === "manager") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 p-2 h-auto"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this class? This action cannot be undone and will fail if there are active enrollments.",
                          )
                        ) {
                          deleteOffering(fallbackOfferingId!)
                            .then(() => {
                              startTransition(() => {
                                router.refresh();
                              });
                            })
                            .catch((e) => {
                              console.error(e);
                              toast.error(
                                e.message || "Failed to delete class",
                              );
                            });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent
          className={`p-0 ${
            isRefreshing ? "blur-[2px] pointer-events-none select-none" : ""
          }`}
        >
          <StudentGrid
            isoDates={isoDates}
            rosters={rostersState}
            onAttendanceUpdate={handleAttendanceUpdate}
            onMakeUpUpdate={handleMakeUpUpdate}
            onMakeUpClick={handleMakeupClick}
            onRemarksUpdate={handleRemarksUpdate}
            onTrialUpdate={handleTrialUpdate}
            onTrialClick={handleTrialClick}
            onTrialConvert={handleTrialConvert}
            user={user}
            termName={termName}
            instructorName={instructorNames}
          />
        </CardContent>
      </Card>

      <EnrollStudentDialog
        open={dialogs.enroll.isOpen}
        onOpenChange={dialogs.enroll.setOpen}
        offeringId={fallbackOfferingId || ""}
        isoDates={isoDates}
        onSuccess={handleDialogSuccess}
      />

      <ScheduleMakeupDialog
        open={dialogs.makeup.isOpen}
        onOpenChange={dialogs.makeup.setOpen}
        selectedDate={dialogs.makeup.selectedDate}
        rosters={rosters}
        onSuccess={handleDialogSuccess}
      />

      <ScheduleTrialDialog
        open={dialogs.trial.isOpen}
        onOpenChange={dialogs.trial.setOpen}
        selectedDate={dialogs.trial.selectedDate}
        sessionId={dialogs.trial.selectedSessionId}
        offeringTitle={title}
        onSuccess={handleDialogSuccess}
      />

      <ConvertTrialDialog
        open={dialogs.convertTrial.isOpen}
        onOpenChange={dialogs.convertTrial.setOpen}
        trial={dialogs.convertTrial.selectedTrial}
        onSuccess={handleDialogSuccess}
        onCreateNewStudent={handleCreateNewStudentFromTrial}
      />

      <AssignInstructorDialog
        open={dialogs.instructor.isOpen}
        onOpenChange={dialogs.instructor.setOpen}
        classOfferingId={fallbackOfferingId || ""}
        currentInstructors={instructors}
        onSuccess={handleDialogSuccess}
        levelName={title}
      />

      {isPracticeOffering && rosters[0]?.session.id && (
        <PracticeRosterDialog
          open={practiceRosterOpen}
          onOpenChange={setPracticeRosterOpen}
          sessionId={rosters[0].session.id}
          title={title}
          userRole={user.role}
          onAttendanceChanged={handleDialogSuccess}
        />
      )}

      {isRefreshing && (
        <div className="fixed inset-0 z-[100px] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-5 shadow-md border border-gray-200">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <p className="text-sm font-medium text-gray-700">Updating…</p>
          </div>
        </div>
      )}
    </div>
  );
}
