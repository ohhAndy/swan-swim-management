import type {
  MakeupLite,
  RosterResponse,
  TrialLite,
} from "@school/shared-types";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import Link from "next/link";

import { LEVEL_MAP } from "@/lib/constants/levels";
import { CurrentUser } from "@/lib/auth/user";
import { hasPermission } from "@/lib/auth/permissions";
import { PermissionGate } from "../auth/PermissionGate";
import RemarksDialog from "./RemarksDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { AlertCircle, CheckCircle, DollarSign } from "lucide-react";

function calcAge(birthdateString: string): number {
  const birthdate = new Date(birthdateString);
  const today = new Date();

  let age = today.getFullYear() - birthdate.getFullYear();

  const hadBirthdayThisYear =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() &&
      today.getDate() >= birthdate.getDate());

  if (!hadBirthdayThisYear) age--;

  return age;
}

function markClass(status: string | undefined) {
  switch (status) {
    case "P": // Present
      return "bg-green-100 text-green-800";
    case "A": // Absent
      return "bg-red-100 text-red-800";
    case "E": // Excused
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-50";
  }
}

function getMakeUpStatusColour(status: string) {
  switch (status) {
    case "attended":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "requested":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-orange-100 text-orange-800";
    case "missed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getTrialStatusColour(status: string) {
  switch (status) {
    case "attended":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-purple-100 text-purple-800";
    case "noshow":
      return "bg-red-100 text-red-800";
    case "converted":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPaymentStatus(status: string | null, invoiceNumber: string | null, balance: number | null) {
  if (!status) {
    // Not invoiced
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Not Invoiced</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }


  if (status === 'paid') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Paid (Invoice #{invoiceNumber})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'partial') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-yellow-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Partial Payment</p>
            <p className="text-xs">Balance: ${balance ? balance.toFixed(2) : "can't find balance"}</p>
            <p className="text-xs">Invoice #{invoiceNumber}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'void') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <span className="text-xs text-muted-foreground">VOID</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Invoice Voided</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

type Row = {
  id: string;
  name: string;
  paymentStatus: string | null;
  balance: number | null;
  invoiceNumber: string | null;
  classRatio: string;
  studentId: string;
  code: string | null;
  level: string | null;
  marks: Record<string, string>;
  skippedSessionIds: string[];
  enrollmentId: string;
  birthdate: string | null;
  remarks: string | null;
};

function buildRow(rosters: RosterResponse[]): Row[] {
  const map = new Map<string, Row>();
  for (const r of rosters) {
    const dayKey = r.session.date.slice(0, 10) + "T04:00:00.000Z";
    for (const p of r.roster) {
      const cur = map.get(p.enrollmentId) ?? {
        id: p.enrollmentId,
        name: p.studentName,
        paymentStatus: p.paymentStatus,
        balance: p.balance,
        invoiceNumber: p.invoiceNumber,
        classRatio: p.classRatio,
        studentId: p.studentId,
        code: p.shortCode ?? null,
        level: p.studentLevel,
        birthdate: p.studentBirthDate,
        skippedSessionIds: p.skippedSessionIds,
        marks: {},
        enrollmentId: p.enrollmentId,
        remarks: p.notes ?? null,
      };

      const s = p.attendance?.status;
      const mark =
        s === "present"
          ? "P"
          : s === "absent"
          ? "A"
          : s === "excused"
          ? "E"
          : "";
      if (mark) {
        cur.marks[dayKey] = mark;
      }
      map.set(p.enrollmentId, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildMakeUps(rosters: RosterResponse[]): Record<string, MakeupLite[]> {
  const makeUpsByDate: Record<string, MakeupLite[]> = {};
  for (const r of rosters) {
    const dayKey = r.session.date.slice(0, 10) + "T04:00:00.000Z";
    if (r.makeups.length > 0) {
      makeUpsByDate[dayKey] = r.makeups.sort((a, b) =>
        a.studentName.localeCompare(b.studentName)
      );
    }
  }
  return makeUpsByDate;
}

function buildTrials(rosters: RosterResponse[]): Record<string, TrialLite[]> {
  const trialsByDate: Record<string, TrialLite[]> = {};
  for (const r of rosters) {
    const dayKey = r.session.date.slice(0, 10) + "T04:00:00.000Z";
    if (r.trials && r.trials.length > 0) {
      trialsByDate[dayKey] = r.trials.sort((a, b) =>
        a.childName.localeCompare(b.childName)
      );
    }
  }
  return trialsByDate;
}

const ATTENDANCE_OPTIONS = [
  { value: "", label: "Not marked", shortLabel: "" },
  { value: "present", label: "Present", shortLabel: "P" },
  { value: "absent", label: "Absent", shortLabel: "A" },
  { value: "excused", label: "Excused", shortLabel: "E" },
];

const MAKEUP_OPTIONS = [
  { value: "", label: "Remove Makeup", shortLabel: "" },
  { value: "scheduled", label: "Scheduled", shortLabel: "S" },
  { value: "requested", label: "Requested", shortLabel: "R" },
  { value: "cancelled", label: "Cancelled", shortLabel: "X" },
  { value: "attended", label: "Attended", shortLabel: "P" },
  { value: "missed", label: "Missed", shortLabel: "A" },
];

const TRIAL_OPTIONS = [
  { value: "", label: "Remove Trial", shortLabel: "" },
  { value: "scheduled", label: "Scheduled", shortLabel: "S" },
  { value: "attended", label: "Attended", shortLabel: "P" },
  { value: "noshow", label: "No Show", shortLabel: "A" },
  { value: "cancelled", label: "Cancelled", shortLabel: "X" },
];

type AttendanceUpdate = {
  enrollmentId: string;
  dayKey: string;
  status: string;
};

type MakeupUpdate = {
  makeupId: string;
  status: string;
};

export function StudentGrid({
  isoDates,
  rosters,
  onAttendanceUpdate,
  onMakeUpUpdate,
  onMakeUpClick,
  onTrialUpdate,
  onTrialClick,
  onTrialConvert,
  onRemarksUpdate,
  user,
}: {
  isoDates: string[];
  rosters: RosterResponse[];
  onAttendanceUpdate?: (
    enrollmentId: string,
    sessionId: string,
    status: string
  ) => Promise<void>;
  onMakeUpUpdate?: (makeUpId: string, status: string) => Promise<void>;
  onMakeUpClick?: (date: string) => void;
  onTrialUpdate?: (trialId: string, status: string) => Promise<void>;
  onTrialClick?: (date: string) => void;
  onTrialConvert?: (trial: { 
    id: string;
    childName: string;
    childAge: number;
    parentPhone: string;
  }) => void;
  onRemarksUpdate?: (enrollmentId: string, notes: string) => Promise<void>;
  user: CurrentUser;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  // Local optimistic overrides
  const [attnOverrides, setAttnOverrides] = useState<
    Record<string, string | undefined>
  >({});
  const [makeupOverrides, setMakeupOverrides] = useState<
    Record<string, string | undefined>
  >({});
  const [trialOverrides, setTrialOverrides] = useState<
    Record<string, string | undefined>
  >({});

  const rows = useMemo(() => buildRow(rosters), [rosters]);
  const makeUps = useMemo(() => buildMakeUps(rosters), [rosters]);
  const trials = useMemo(() => buildTrials(rosters), [rosters]);

  const header = useMemo(() => {
    return isoDates.map((iso) => ({
      key: iso.split("T")[0],
      label: new Date(iso).toLocaleDateString("en-CA"),
    }));
  }, [isoDates]);

  const dateToSessionId = new Map<string, string>();
  for (const r of rosters) {
    const dateKey = r.session.date.slice(0, 10) + "T04:00:00.000Z";
    dateToSessionId.set(dateKey, r.session.id);
  }

  const cols = isoDates.length;

  const maxMakeUpsPerDate = Math.max(
    0,
    ...Object.values(makeUps).map((m) => m.length)
  );
  const maxTrialsPerDate = Math.max(
    0,
    ...Object.values(trials).map((t) => t.length)
  );

  const handleAttendanceUpdate = async (
    enrollmentId: string,
    dayKey: string,
    newStatus: string
  ) => {
    const sessionId = dateToSessionId.get(dayKey);
    if (!sessionId || !onAttendanceUpdate) return;

    const updateKey = `${enrollmentId}-${dayKey}`;
    const overrideKey = `${enrollmentId}|${dayKey}`;

    setAttnOverrides((m) => ({ ...m, [overrideKey]: newStatus }));
    setUpdating(updateKey);

    try {
      await onAttendanceUpdate(enrollmentId, sessionId, newStatus);
    } catch (error) {
      console.error("Failed to Update Attendance", error);
      setAttnOverrides((m) => {
        const n = { ...m };
        delete n[overrideKey];
        return n;
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleMakeUpUpdate = async (makeUpId: string, newStatus: string) => {
    if (!onMakeUpUpdate) return;

    const updateKey = `makeup-${makeUpId}`;

    if (newStatus === "") {
      setMakeupOverrides((prev) => ({ ...prev, [makeUpId]: "__removed__" }));
    } else {
      setMakeupOverrides((prev) => ({ ...prev, [makeUpId]: newStatus }));
    }

    setUpdating(updateKey);

    try {
      await onMakeUpUpdate(makeUpId, newStatus);
    } catch (error) {
      console.error("Failed to update make-up:", error);
      setMakeupOverrides((m) => {
        const n = { ...m };
        delete n[makeUpId];
        return n;
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleTrialUpdate = async (trialId: string, newStatus: string) => {
    if (!onTrialUpdate) return;

    const updateKey = `trial-${trialId}`;

    if (newStatus === "") {
      setTrialOverrides((prev) => ({ ...prev, [trialId]: "__removed__" }));
    } else {
      setTrialOverrides((prev) => ({ ...prev, [trialId]: newStatus }));
    }

    setUpdating(updateKey);

    try {
      await onTrialUpdate(trialId, newStatus);
    } catch (error) {
      console.error("Failed to update trial:", error);
      setTrialOverrides((m) => {
        const n = { ...m };
        delete n[trialId];
        return n;
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveRemarks = async (enrollmentId: string, remarks: string) => {
    if (!onRemarksUpdate) return;

    const updateKey = `remarks-${enrollmentId}`;
    setUpdating(updateKey);

    try {
      await onRemarksUpdate(enrollmentId, remarks);
    } catch (error) {
      console.error("Failed to update remarks:", error);
    } finally {
      setUpdating(null);
    }
  };

  const canEdit: boolean = hasPermission(user.role, "markAttendance");

  return (
    <div
      className="grid border-t text-sm bg-muted"
      style={{
        gridTemplateColumns: `0.5fr 2fr 52px 52px 52px repeat(${cols}, minmax(52px,1fr)) 1.5fr`,
      }}
    >
      <div className="bg-muted px-2 py-1 text-center font-semibold">
        Status
      </div>
      <div className="bg-muted px-2 py-1 text-center font-semibold">
        Student
      </div>
      <div className="bg-muted px-2 py-1 text-center font-semibold">
        Ratio
      </div>
      <div className="bg-muted px-2 py-1 text-center font-semibold">Age</div>
      <div className="bg-muted px-2 py-1 text-center font-semibold">Level</div>
      {header.map((h, i) => (
        <div
          key={`h-${i}`}
          className="bg-muted px-2 py-1 text-center font-semibold sticky top-0 z-10"
          title={h.key}
        >
          {h.label.slice(5)}
        </div>
      ))}

      <div className="bg-muted px-2 py-1 font-semibold text-center">
        Remarks
      </div>

      {rows.map((r) => (
        <div key={r.id} className="contents">
          <div key={r.id + "-payment"}className="px-2 py-1 flex items-center justify-center">
            {getPaymentStatus(r.paymentStatus, r.invoiceNumber, r.balance)}
          </div>
          <div
            key={r.id + "-name"}
            className="px-2 py-1 text-center truncate max-w-[150px]"
          >
            <Link className="hover:underline" href={`/students/${r.studentId}`}>
              {r.name}
            </Link>
          </div>
          <div key={r.id + "-ratio"} className="px-2 py-1 text-center">
            {r.classRatio ? r.classRatio : ""}
          </div>
          <div key={r.id + "-age"} className="px-2 py-1 text-center">
            {r.birthdate ? calcAge(r.birthdate) : ""}
          </div>
          <div key={r.id + "-level"} className="px-2 py-1 text-center">
            {r.level ? LEVEL_MAP.get(r.level) : ""}
          </div>

          {header.map((h, i) => {
            const dayKey = h.key + "T04:00:00.000Z";
            const sessionId = dateToSessionId.get(dayKey);
            const isSkipped =
              sessionId && r.skippedSessionIds.includes(sessionId);
            const updateKey = `${r.enrollmentId}-${dayKey}`;
            const isUpdating = updating === updateKey;

            const baseMark = r.marks[dayKey];
            const baseStatus =
              baseMark === "P"
                ? "present"
                : baseMark === "A"
                ? "absent"
                : baseMark === "E"
                ? "excused"
                : "";

            const overrideStatus = attnOverrides[`${r.enrollmentId}|${dayKey}`];
            const currentStatus = overrideStatus ?? baseStatus;

            const mark =
              currentStatus === "present"
                ? "P"
                : currentStatus === "absent"
                ? "A"
                : currentStatus === "excused"
                ? "E"
                : "";

            if (isSkipped) {
              return (
                <div
                  key={`${r.id}-${i}`}
                  className="px-2 py-1 text-center font-semibold rounded bg-black text-white"
                >
                  SKIP
                </div>
              );
            }

            return (
              <DropdownMenu key={`${r.id}-${i}`}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-2 py-1 text-center font-semibold rounded transition-colors hover:bg-gray-200 ${markClass(
                      mark
                    )} ${
                      isUpdating || !canEdit
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${!canEdit ? "pointer-events-none opacity-70" : ""}`}
                    disabled={isUpdating || !canEdit}
                    title={
                      canEdit
                        ? `${r.name} - ${h.label} - Click to change attendance`
                        : `${r.name} - ${h.label} - Read Only`
                    }
                  >
                    {mark ?? ""}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {ATTENDANCE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={(e) => {
                        if (canEdit) {
                          handleAttendanceUpdate(
                            r.enrollmentId,
                            dayKey,
                            option.value
                          );
                        }
                      }}
                      className={
                        currentStatus === option.value ? "bg-blue-50" : ""
                      }
                    >
                      <span className="font-medium mr-2">
                        {option.shortLabel || "—"}
                      </span>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          <RemarksDialog
            key={r.id + "-remarks"}
            title={`${r.name} - Remarks`}
            initialRemarks={r.remarks}
            triggerLabel="View / Edit"
            onSave={(remarks) => handleSaveRemarks(r.enrollmentId, remarks)}
          />
        </div>
      ))}

      {maxMakeUpsPerDate > 0 && (
        <>
          <div className="col-span-full border-t-2 border-gray-00 my-1"></div>
          {Array.from({ length: maxMakeUpsPerDate }, (_, rowIndex) => (
            <div key={`makeup-row-${rowIndex}`} className="contents">
              <div className="px-2 py-1 font-bold text-center bg-blue-50 text-md text-gray-600">
                {rowIndex === 0 ? "Make-ups" : ""}
              </div>
              <div className="px-2 py-1 text-center bg-blue-50"></div>
              <div className="px-2 py-1 text-center bg-blue-50"></div>
              <div className="px-2 py-1 text-center bg-blue-50"></div>
              <div className="px-2 py-1 text-center bg-blue-50"></div>

              {header.map((h, colIndex) => {
                const dayKey = h.key + "T04:00:00.000Z";
                const makeUpsForDate = makeUps[dayKey] || [];
                const makeUpStudent = makeUpsForDate[rowIndex]; // Get the make-up for this row index

                if (makeUpStudent) {
                  const override = makeupOverrides[makeUpStudent.id];

                  if (override === "__removed__") {
                    return (
                      <div
                        key={`makeup-removed-${rowIndex}-${colIndex}`}
                        className="px-2 py-1 text-center bg-blue-50"
                      ></div>
                    );
                  }

                  const effectiveStatus = override ?? makeUpStudent.status;

                  const statusMark =
                    effectiveStatus === "attended"
                      ? "P"
                      : effectiveStatus === "scheduled"
                      ? "S"
                      : effectiveStatus === "requested"
                      ? "R"
                      : effectiveStatus === "cancelled"
                      ? "X"
                      : effectiveStatus === "missed"
                      ? "A"
                      : "";

                  const statusClass = getMakeUpStatusColour(effectiveStatus);
                  const updateKey = `makeup-${makeUpStudent.id}`;
                  const isUpdating = updating === updateKey;

                  return (
                    <DropdownMenu key={`makeup-${rowIndex}-${colIndex}`}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`px-1 py-1 text-center text-xs font-medium rounded hover:bg-gray-200 transition-colors cursor-pointer ${statusClass} ${
                            isUpdating ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isUpdating}
                          title={`${makeUpStudent.studentName} (${makeUpStudent.level}) (${makeUpStudent.status}) - Click to change`}
                        >
                          <div className="truncate">
                            {makeUpStudent.studentName.split(" ")[0]} -{" "}
                            {makeUpStudent.level
                              ? LEVEL_MAP.get(makeUpStudent.level)
                              : ""}
                          </div>
                          <div className="font-bold">{statusMark}</div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {MAKEUP_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onSelect={(e) =>
                              handleMakeUpUpdate(makeUpStudent.id, option.value)
                            }
                            className={
                              makeUpStudent.status === option.value
                                ? "bg-blue-50"
                                : ""
                            }
                          >
                            <span className="font-medium mr-2">
                              {option.shortLabel || "-"}
                            </span>
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                } else {
                  // Empty cell for dates with no make-up in this row
                  return (
                    <div
                      key={`makeup-empty-${rowIndex}-${colIndex}`}
                      className="px-2 py-1 text-center bg-blue-50"
                    ></div>
                  );
                }
              })}

              <div className="px-2 py-1 bg-blue-50" />
            </div>
          ))}
        </>
      )}

      {/* TRIAL BOOKINGS SECTION */}
      {maxTrialsPerDate > 0 && (
        <>
          {Array.from({ length: maxTrialsPerDate }, (_, rowIndex) => (
            <div key={`trial-row-${rowIndex}`} className="contents">
              <div className="px-2 py-1 font-bold text-center bg-purple-50 text-md text-gray-600">
                {rowIndex === 0 ? "Trials" : ""}
              </div>
              <div className="px-2 py-1 text-center bg-purple-50"></div>
              <div className="px-2 py-1 text-center bg-purple-50"></div>
              <div className="px-2 py-1 text-center bg-purple-50"></div>
              <div className="px-2 py-1 text-center bg-purple-50"></div>

              {header.map((h, colIndex) => {
                const dayKey = h.key + "T04:00:00.000Z";
                const trialsForDate = trials[dayKey] || [];
                const trialStudent = trialsForDate[rowIndex];

                if (trialStudent) {
                  const override = trialOverrides[trialStudent.id];

                  if (override === "__removed__") {
                    return (
                      <div
                        key={`trial-removed-${rowIndex}-${colIndex}`}
                        className="px-2 py-1 text-center bg-purple-50"
                      ></div>
                    );
                  }

                  const effectiveStatus = override ?? trialStudent.status;

                  const statusMark =
                    effectiveStatus === "attended"
                      ? "P"
                      : effectiveStatus === "scheduled"
                      ? "S"
                      : effectiveStatus === "noshow"
                      ? "A"
                      : effectiveStatus === "converted"
                      ? "C"
                      : effectiveStatus === "cancelled"
                      ? "X"
                      : "";

                  const statusClass = getTrialStatusColour(effectiveStatus);
                  const updateKey = `trial-${trialStudent.id}`;
                  const isUpdating = updating === updateKey;
                  const isConverted = effectiveStatus === "converted";

                  return (
                    <DropdownMenu key={`trial-${rowIndex}-${colIndex}`}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`px-1 py-1 text-center text-xs font-medium rounded hover:bg-gray-200 transition-colors cursor-pointer ${statusClass} ${
                            isUpdating ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isUpdating}
                          title={`${trialStudent.childName} (Age ${trialStudent.childAge}) ${
                            isConverted ? '(Converted - No further action)' : `(${trialStudent.status}) - Click to change`
                          }`}
                          
                        >
                          <div className="truncate">
                            {trialStudent.childName} -{" "}
                            {trialStudent.childAge.toString()}y
                          </div>
                          <div className="font-bold">{statusMark}</div>
                        </button>
                      </DropdownMenuTrigger>
                      {!isConverted && (
                        <DropdownMenuContent>
                          {TRIAL_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onSelect={(e) =>
                                handleTrialUpdate(trialStudent.id, option.value)
                              }
                              className={
                                trialStudent.status === option.value
                                  ? "bg-purple-50"
                                  : ""
                              }
                            >
                              <span className="font-medium mr-2">
                                {option.shortLabel || "-"}
                              </span>
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                          {/* Convert Button */}
                          <DropdownMenuItem
                            onSelect={(e) => {
                              if (onTrialConvert) {
                                onTrialConvert({
                                  id: trialStudent.id,
                                  childName: trialStudent.childName,
                                  childAge: trialStudent.childAge,
                                  parentPhone: trialStudent.parentPhone,
                                });
                              }
                            }}
                            className="bg-blue-50 font-medium border-t"
                          >
                            <span className="font-bold mr-2">→</span>
                            Convert to Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  );
                } else {
                  return (
                    <div
                      key={`trial-empty-${rowIndex}-${colIndex}`}
                      className="px-2 py-1 text-center bg-purple-50"
                    ></div>
                  );
                }
              })}

              <div className="px-2 py-1 bg-purple-50" />
            </div>
          ))}
        </>
      )}

      <div className="contents group">
        <div className="px-2 py-1 text-center bg-gray-50 text-md text-gray-500">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            Add
          </span>
        </div>
        <div className="px-2 py-1 text-center bg-gray-50"></div>
        <div className="px-2 py-1 text-center bg-gray-50"></div>
        <div className="px-2 py-1 text-center bg-gray-50"></div>
        <div className="px-2 py-1 text-center bg-gray-50"></div>

        {header.map((h, colIndex) => {
          const dayKey = h.key + "T04:00:00.000Z";
          return (
            <div
              key={`add-${colIndex}`}
              className="px-2 py-1 text-center bg-gray-50 group-hover:bg-gray-100 transition-colors"
            >
              <PermissionGate
                allowedRoles={["admin", "manager"]}
                currentRole={user.role}
              >
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Makeup Button */}
                  <button
                    onClick={() => onMakeUpClick?.(dayKey)}
                    className="p-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-xs"
                    title={`Add make-up for ${h.label}`}
                  >
                    + Makeup
                  </button>

                  {/* Trial Button */}
                  <button
                    onClick={() => onTrialClick?.(dayKey)}
                    className="p-1 rounded hover:bg-purple-100 text-purple-600 hover:text-purple-700 text-xs"
                    title={`Add trial for ${h.label}`}
                  >
                    + Trial
                  </button>
                </div>
              </PermissionGate>
            </div>
          );
        })}

        <div className="px-2 py-1 bg-gray-50" />
      </div>
    </div>
  );
}
