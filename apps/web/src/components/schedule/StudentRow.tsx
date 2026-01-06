import { Row } from "./grid-types";
import Link from "next/link";
import { LEVEL_MAP } from "@/lib/constants/levels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import RemarksDialog from "./RemarksDialog";
import { AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { calcAge, markClass } from "@/lib/utils/student-helpers";

// Duplicate of getPaymentStatus for now, can be extracted if needed
function getPaymentStatus(
  status: string | null,
  invoiceNumber: string | null,
  balance: number | null
) {
  if (!status) {
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

  if (status === "paid") {
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

  if (status === "partial") {
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
            <p className="text-xs">
              Balance: ${balance ? balance.toFixed(2) : "can't find balance"}
            </p>
            <p className="text-xs">Invoice #{invoiceNumber}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "void") {
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

const ATTENDANCE_OPTIONS = [
  { value: "", label: "Not marked", shortLabel: "" },
  { value: "present", label: "Present", shortLabel: "P" },
  { value: "absent", label: "Absent", shortLabel: "A" },
  { value: "excused", label: "Excused", shortLabel: "E" },
];

interface StudentRowProps {
  row: Row;
  header: { key: string; label: string }[];
  dateToSessionId: Map<string, string>;
  attnOverrides: Record<string, string | undefined>;
  updating: string | null;
  canEdit: boolean;
  onAttendanceUpdate: (
    enrollmentId: string,
    dayKey: string,
    status: string
  ) => Promise<void>;
  onSaveRemarks: (enrollmentId: string, remarks: string) => Promise<void>;
}

export function StudentRow({
  row,
  header,
  dateToSessionId,
  attnOverrides,
  updating,
  canEdit,
  onAttendanceUpdate,
  onSaveRemarks,
}: StudentRowProps) {
  return (
    <div className="contents">
      <div className="px-2 py-1 flex items-center justify-center bg-white">
        {getPaymentStatus(row.paymentStatus, row.invoiceNumber, row.balance)}
      </div>
      <div className="px-2 py-1 text-center truncate max-w-[150px] bg-white">
        <Link className="hover:underline" href={`/students/${row.studentId}`}>
          {row.name}
        </Link>
      </div>
      <div className="px-2 py-1 text-center bg-white">
        {row.classRatio ? row.classRatio : ""}
      </div>
      <div className="px-2 py-1 text-center bg-white">
        {row.birthdate ? calcAge(row.birthdate) : ""}
      </div>
      <div className="px-2 py-1 text-center bg-white">
        {row.level ? LEVEL_MAP.get(row.level) : ""}
      </div>

      {header.map((h, i) => {
        const dayKey = h.key + "T04:00:00.000Z";
        const sessionId = dateToSessionId.get(dayKey);
        const isSkipped =
          sessionId && row.skippedSessionIds.includes(sessionId);
        const updateKey = `${row.enrollmentId}-${dayKey}`;
        const isUpdating = updating === updateKey;

        const baseMark = row.marks[dayKey];
        const baseStatus =
          baseMark === "P"
            ? "present"
            : baseMark === "A"
            ? "absent"
            : baseMark === "E"
            ? "excused"
            : "";

        const overrideStatus = attnOverrides[`${row.enrollmentId}|${dayKey}`];
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
              key={`${row.id}-${i}`}
              className="px-2 py-1 text-center font-semibold rounded bg-black text-white"
            >
              SKIP
            </div>
          );
        }

        return (
          <DropdownMenu key={`${row.id}-${i}`}>
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
                    ? `${row.name} - ${h.label} - Click to change attendance`
                    : `${row.name} - ${h.label} - Read Only`
                }
              >
                {mark ?? ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ATTENDANCE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => {
                    if (canEdit) {
                      onAttendanceUpdate(
                        row.enrollmentId,
                        dayKey,
                        option.value
                      );
                    }
                  }}
                  className={currentStatus === option.value ? "bg-blue-50" : ""}
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
      <div className="px-2 py-1 flex items-center justify-center bg-white">
        {row.remarks ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <RemarksDialog
                    key={row.id + "-remarks"}
                    title={`${row.name} - Remarks`}
                    initialRemarks={row.remarks}
                    triggerLabel="View / Edit"
                    onSave={(remarks) =>
                      onSaveRemarks(row.enrollmentId, remarks)
                    }
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs break-words">
                {row.remarks}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <RemarksDialog
            key={row.id + "-remarks"}
            title={`${row.name} - Remarks`}
            initialRemarks={row.remarks}
            triggerLabel="View / Edit"
            onSave={(remarks) => onSaveRemarks(row.enrollmentId, remarks)}
          />
        )}
      </div>
    </div>
  );
}
