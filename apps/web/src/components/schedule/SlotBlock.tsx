"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StudentGrid } from "./StudentGrid";
import type { RosterResponse } from "@school/shared-types";
import {
  upsertAttendance,
  updateMakeupStatus,
} from "@/lib/api/attendance-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "../ui/button";
import { EnrollStudentDialog } from "./EnrollStudentDialog";
import { ScheduleMakeupDialog } from "./ScheduleMakeUpDialog";
import { CurrentUser } from "@/lib/auth/user";
import { PermissionGate } from "../auth/PermissionGate";
import { updateRemarks } from "@/lib/api/students-client";
import { Loader2, Users } from "lucide-react";
import OfferingDialog from "./OfferingInfoDialog";
import { updateOfferingInfo } from "@/lib/api/schedule-client";
import { AssignInstructorDialog } from "./AssignInstructorDialog";
import { ScheduleTrialDialog } from "./ScheduleTrialDialog";
import { updateTrialStatus } from "@/lib/api/trial-client";
import { ConvertTrialDialog } from "./ConvertTrialDialog";
import { Trash2 } from "lucide-react";
import { deleteOffering } from "@/lib/api/schedule-client";
export function SlotBlock({
  title,
  isoDates,
  rosters,
  user,
}: {
  title: string;
  isoDates: string[];
  rosters: RosterResponse[];
  user: CurrentUser;
}) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [makeupDialogOpen, setMakeupDialogOpen] = useState(false);
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [selectedMakeupDate, setSelectedMakeupDate] = useState<string | null>(
    null
  );
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [selectedTrialDate, setSelectedTrialDate] = useState<string | null>(
    null
  );
  const [selectedTrialSessionId, setSelectedTrialSessionId] = useState<
    string | null
  >(null);
  const [convertTrialDialogOpen, setConvertTrialDialogOpen] = useState(false);
  const [selectedTrialForConversion, setSelectedTrialForConversion] = useState<{
    id: string;
    childName: string;
    childAge: number;
    parentPhone: string;
  } | null>(null);
  const [rostersState, setRostersState] = useState(rosters);

  useEffect(() => {
    setRostersState(rosters);
  }, [rosters]);

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
    status: string
  ) => {
    try {
      await upsertAttendance(
        enrollmentId,
        sessionId,
        status as "present" | "absent" | "excused" | ""
      );
    } catch (error) {
      console.error("Failed to upsert attendance:", error);
    }
  };

  const handleMakeUpUpdate = async (makeUpId: string, status: string) => {
    try {
      await updateMakeupStatus(
        makeUpId,
        status as "scheduled" | "attended" | "cancelled" | "requested" | ""
      );
    } catch (error) {
      console.error("Failed to update makeup status:", error);
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
          | ""
      );
    } catch (error) {
      console.error("Failed to update trial status:", error);
    }
  };

  const handleRemarksUpdate = async (enrollmentId: string, notes: string) => {
    try {
      await updateRemarks(enrollmentId, notes);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update remarks:", error);
      throw error; // Re-throw so the dialog can show error state
    }
  };

  const handleOfferingUpdate = async (title: string) => {
    try {
      await updateOfferingInfo(fallbackOfferingId, title);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update remarks:", error);
      throw error; // Re-throw so the dialog can show error state
    }
  };

  const handleMakeupClick = (date: string) => {
    setSelectedMakeupDate(date);
    setMakeupDialogOpen(true);
  };

  const handleTrialClick = (date: string) => {
    setSelectedTrialDate(date);
    // Find the session ID for this date
    const ymd = date.slice(0, 10);
    const sessionId = byDate[ymd]?.sessionId || null;
    setSelectedTrialSessionId(sessionId);
    setTrialDialogOpen(true);
  };

  const handleTrialConvert = (trial: {
    id: string;
    childName: string;
    childAge: number;
    parentPhone: string;
  }) => {
    setSelectedTrialForConversion(trial);
    setConvertTrialDialogOpen(true);
  };

  const handleCreateNewStudentFromTrial = (trialInfo: {
    childName: string;
    childAge: number;
    parentPhone: string;
  }) => {
    // TODO: Navigate to create student page with pre-filled info
    // For now, just close the dialog
    setConvertTrialDialogOpen(false);
    alert(
      `Create new student: ${trialInfo.childName}\nThis should navigate to the create student page with info pre-filled.`
    );
  };

  const handleDialogSuccess = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative group break-inside-avoid print:mb-5">
      <Card className="print:break-inside-avoid bg-white shadow-sm">
        <CardHeader className="gap-1 py-2">
          <div className="flex flex-col items-center justify-between gap-2">
            <div className="flex items-center justify-between w-full p-2">
              <div className="flex items-center gap-5">
                <CardTitle className="text-base">{title}</CardTitle>
                <OfferingDialog
                  initialTitle={title}
                  triggerLabel="Edit"
                  onSave={handleOfferingUpdate}
                />
              </div>

              <PermissionGate
                allowedRoles={["admin", "manager"]}
                currentRole={user.role}
              >
                <Button
                  variant="outline"
                  onClick={() => setEnrollDialogOpen(true)}
                  disabled={!fallbackOfferingId}
                  className="text-xs hover:underline font-medium opacity-70 hover:opacity-100 transition-all"
                >
                  + Enroll
                </Button>
              </PermissionGate>
            </div>
            <Separator className="bg-black" />
            <div className="flex items-center gap-5 w-full">
              <PermissionGate
                allowedRoles={["admin", "manager", "supervisor"]}
                currentRole={user.role}
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInstructorDialogOpen(true)}
                    disabled={!fallbackOfferingId}
                    className="text-xs bg-[#bce0f7]"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {instructorNames || "No Instructor Assigned"}
                  </Button>

                  {(user.role === "admin" || user.role === "manager") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 p-2 h-auto"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this class? This action cannot be undone and will fail if there are active enrollments."
                          )
                        ) {
                          deleteOffering(fallbackOfferingId!)
                            .then(() => {
                              startTransition(() => {
                                router.refresh();
                              });
                            })
                            .catch((e) => alert(e.message));
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
          />
        </CardContent>
      </Card>

      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        offeringId={fallbackOfferingId || ""}
        isoDates={isoDates}
        onSuccess={handleDialogSuccess}
      />

      <ScheduleMakeupDialog
        open={makeupDialogOpen}
        onOpenChange={setMakeupDialogOpen}
        selectedDate={selectedMakeupDate}
        rosters={rosters}
        onSuccess={handleDialogSuccess}
      />

      <ScheduleTrialDialog
        open={trialDialogOpen}
        onOpenChange={setTrialDialogOpen}
        selectedDate={selectedTrialDate}
        sessionId={selectedTrialSessionId}
        offeringTitle={title}
        onSuccess={handleDialogSuccess}
      />

      <ConvertTrialDialog
        open={convertTrialDialogOpen}
        onOpenChange={setConvertTrialDialogOpen}
        trial={selectedTrialForConversion}
        onSuccess={handleDialogSuccess}
        onCreateNewStudent={handleCreateNewStudentFromTrial}
      />

      <AssignInstructorDialog
        open={instructorDialogOpen}
        onOpenChange={setInstructorDialogOpen}
        classOfferingId={fallbackOfferingId || ""}
        currentInstructors={instructors}
        onSuccess={handleDialogSuccess}
        levelName={title}
      />

      {isRefreshing && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-5 shadow-md border border-gray-200">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <p className="text-sm font-medium text-gray-700">Updating…</p>
          </div>
        </div>
      )}
    </div>
  );
}
