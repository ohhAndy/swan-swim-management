"use client";

import { BackButton } from "@/components/nav/BackButton";
import { format } from "date-fns";
import { updateRemarks, updateStudent } from "@/lib/api/students-client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { RosterItem } from "@/components/schedule/DailyClassRoster";
import { DailyClassRoster } from "@/components/schedule/DailyClassRoster";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import {
  updateMakeupStatus,
  upsertAttendance,
} from "@/lib/api/attendance-client";
import { updateTrialStatus } from "@/lib/api/trial-client";
import { AssignInstructorDialog } from "@/components/schedule/AssignInstructorDialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InstructorInfo, TrialStatus } from "@school/shared-types";

export interface DailyClass {
  id: string; // Session ID
  offeringId: string;
  title: string;
  time: string;
  instructors: InstructorInfo[];
  capacity: number;
  filled: number;
  roster: RosterItem[];
}

export interface DailyScheduleResponse {
  date: string;
  termName: string;
  classes: DailyClass[];
}

export default function DailyScheduleClient({
  data,
  termId,
  date,
}: {
  data: DailyScheduleResponse;
  termId: string;
  date: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingClass, setEditingClass] = useState<DailyClass | null>(null);

  const handleLevelUpdate = async (studentId: string, level: string) => {
    await updateStudent(studentId, { level });
    router.refresh();
  };

  return (
    <main className="p-4 md:p-6 pb-20 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton fallbackHref={`/term/${termId}/schedule`} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(new Date(date + "T00:00:00"), "EEEE, MMMM do, yyyy")}
          </h1>
          <p className="text-muted-foreground">{data.termName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {data.classes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No classes scheduled for this date.</p>
          </div>
        ) : (
          <Tabs defaultValue={data.classes[0]?.time}>
            <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="w-auto inline-flex justify-start md:justify-center">
                {Array.from(new Set(data.classes.map((c) => c.time))).map(
                  (time) => (
                    <TabsTrigger key={time} value={time}>
                      {time}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </div>

            {Array.from(new Set(data.classes.map((c) => c.time))).map(
              (time) => (
                <TabsContent key={time} value={time} className="space-y-6 mt-6">
                  {data.classes
                    .filter((c) => c.time === time)
                    .map((cls) => (
                      <Card key={cls.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/40 py-3 border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg">
                                {cls.title}
                              </CardTitle>
                              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4" />
                                {cls.time}
                                <span className="mx-1">•</span>
                                {cls.instructors.length > 0
                                  ? cls.instructors
                                      .map((i) => i.staffName)
                                      .join(", ")
                                  : "No Instructor"}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditingClass(cls)}
                                >
                                  <Edit className="h-3 w-3" />
                                  <span className="sr-only">
                                    Edit Instructors
                                  </span>
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {cls.filled}/{cls.capacity}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase font-medium">
                                Students
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <DailyClassRoster
                            roster={cls.roster}
                            onLevelUpdate={handleLevelUpdate}
                            onAttendanceUpdate={async (item, status) => {
                              if (item.type === "student") {
                                // cls.id is the classSessionId
                                await upsertAttendance(
                                  item.id,
                                  cls.id,
                                  status as
                                    | "present"
                                    | "absent"
                                    | "excused"
                                    | ""
                                );
                              } else if (item.type === "makeup") {
                                await updateMakeupStatus(
                                  item.id,
                                  status as
                                    | "scheduled"
                                    | "requested"
                                    | "cancelled"
                                    | "attended"
                                    | "missed"
                                    | ""
                                ); // item.id is makeupId
                              } else if (item.type === "trial") {
                                await updateTrialStatus(
                                  item.id,
                                  status as TrialStatus | ""
                                ); // item.id is bookingId
                              }
                              router.refresh();
                            }}
                            onRemarksUpdate={async (item, remarks) => {
                              if (item.type === "student") {
                                await updateRemarks(item.id, remarks);
                                router.refresh();
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>
              )
            )}
          </Tabs>
        )}
      </div>

      {editingClass && (
        <AssignInstructorDialog
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
          classOfferingId={editingClass.offeringId}
          currentInstructors={editingClass.instructors}
          levelName={editingClass.title}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </main>
  );
}
