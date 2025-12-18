"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LEVEL_MAP,
  SWIMMER_LEVELS,
  PRESCHOOL_LEVELS,
  SWIMTEAM_LEVELS,
} from "@/lib/constants/levels";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemarksDialog from "./RemarksDialog";

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
};

const ALL_LEVELS = [...PRESCHOOL_LEVELS, ...SWIMMER_LEVELS, ...SWIMTEAM_LEVELS];

type Props = {
  roster: RosterItem[];
  onLevelUpdate?: (studentId: string, level: string) => Promise<void>;
  onAttendanceUpdate?: (item: RosterItem, status: string) => Promise<void>;
  onRemarksUpdate?: (item: RosterItem, remarks: string) => Promise<void>;
};

export function DailyClassRoster({
  roster,
  onLevelUpdate,
  onAttendanceUpdate,
  onRemarksUpdate,
}: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleLevelUpdate = async (studentId: string, newLevel: string) => {
    if (!onLevelUpdate) return;
    setUpdating(`level-${studentId}`);
    try {
      await onLevelUpdate(studentId, newLevel);
    } catch (e) {
      console.error(e);
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
              item.isSkipped && "opacity-60 bg-muted"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="font-semibold text-base flex items-center gap-2">
                  {item.type === "student" && item.studentId ? (
                    <Link
                      href={`/students/${item.studentId}`}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span>{item.name}</span>
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
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.age ? `${item.age} yrs` : "Age N/A"} •{" "}
                  {item.ratio || "3:1"}
                </div>
              </div>

              {/* Level Badge (Editable) */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={
                    !onLevelUpdate || item.type === "trial" || updating !== null
                  }
                >
                  <Badge
                    variant={item.level ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer hover:bg-primary/90 transition-colors",
                      !item.level && "text-muted-foreground"
                    )}
                  >
                    {item.level
                      ? LEVEL_MAP.get(item.level) || item.level
                      : "No Level"}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {ALL_LEVELS.map((lvl) => (
                    <DropdownMenuItem
                      key={lvl}
                      onSelect={() =>
                        item.studentId && handleLevelUpdate(item.studentId, lvl)
                      }
                    >
                      <span
                        className={cn(
                          "mr-2",
                          item.level === lvl && "font-bold"
                        )}
                      >
                        {lvl}
                      </span>
                    </DropdownMenuItem>
                  ))}
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
              {item.type === "student" ? (
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
                  item.isSkipped && "bg-gray-50 opacity-60"
                )}
              >
                <td className="p-3">
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center gap-2">
                      {item.type === "student" && item.studentId ? (
                        <Link
                          href={`/students/${item.studentId}`}
                          className="hover:underline text-blue-600"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        item.name
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
                    </div>
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
                        updating !== null
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
                      {ALL_LEVELS.map((lvl) => (
                        <DropdownMenuItem
                          key={lvl}
                          onSelect={() =>
                            item.studentId &&
                            handleLevelUpdate(item.studentId, lvl)
                          }
                        >
                          <span
                            className={cn(
                              "mr-2",
                              item.level === lvl && "font-bold"
                            )}
                          >
                            {lvl}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center">
                    <AttendanceButton
                      item={item}
                      loading={updating === `status-${item.id}`}
                      onUpdate={(s) => handleStatusUpdate(item, s)}
                    />
                  </div>
                </td>
                <td className="p-3 text-center">
                  {item.type === "student" ? (
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
    </div>
  );
}

function AttendanceButton({
  item,
  loading,
  onUpdate,
}: {
  item: RosterItem;
  loading: boolean;
  onUpdate: (s: string) => void;
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
        disabled={loading || item.status === "converted"}
      >
        <Button
          variant={variant}
          size="sm"
          className={cn(
            "w-24 h-8 text-xs font-semibold shadow-sm transition-all",
            className
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
