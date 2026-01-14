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
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  CalendarClock,
  CalendarX,
  CalendarCheck,
} from "lucide-react";
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
  onReportCardUpdate?: (enrollmentId: string, status: string) => Promise<void>;
  userRole: string;
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
  onReportCardUpdate,
  userRole,
}: StudentRowProps) {
  return (
    <div className="contents">
      <div className="px-2 py-1 flex items-center justify-center gap-1 bg-white">
        {getPaymentStatus(row.paymentStatus, row.invoiceNumber, row.balance)}
        {userRole !== "supervisor" && row.nextTermStatus === "paid" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-green-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next Term: Paid</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {userRole !== "supervisor" && row.nextTermStatus === "enrolled" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-orange-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next Term: Enrolled (Unpaid)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {userRole !== "supervisor" &&
          (!row.nextTermStatus || row.nextTermStatus === "not_registered") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center opacity-20">
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
      <div className="px-2 py-1 text-center truncate max-w-[150px] bg-white">
        <Link
          className="hover:underline"
          href={`/students/${row.studentId}`}
          title={row.name}
        >
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
      <div className="p-0 text-center bg-white flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!onReportCardUpdate || !canEdit}
            className={`w-full h-full text-[10px] font-medium flex items-center justify-center transition-colors ${
              !row.reportCardStatus || row.reportCardStatus === "not_created"
                ? "bg-white text-gray-400 hover:bg-gray-50"
                : row.reportCardStatus === "created"
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {row.reportCardStatus === "created"
              ? "Created"
              : row.reportCardStatus === "given"
              ? "Given"
              : "None"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                onReportCardUpdate?.(row.enrollmentId, "not_created")
              }
            >
              Not Created
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onReportCardUpdate?.(row.enrollmentId, "created")}
            >
              Created
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onReportCardUpdate?.(row.enrollmentId, "given")}
            >
              Given
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

        const notes = row.markMeta?.[dayKey]?.notes;
        const isTransferred = notes?.includes("[Transferred]");

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
                className={`content-center relative px-2 py-1 text-center font-semibold rounded transition-all hover:bg-gray-200 ${markClass(
                  mark
                )} ${
                  isUpdating || !canEdit
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } ${!canEdit ? "pointer-events-none opacity-70" : ""} ${
                  isTransferred
                    ? "border border-transparent"
                    : "border border-transparent"
                }`}
                disabled={isUpdating || !canEdit}
                title={
                  canEdit
                    ? `${row.name} - ${h.label}${
                        isTransferred ? " (Transferred)" : ""
                      } - Click to change attendance`
                    : `${row.name} - ${h.label}${
                        isTransferred ? " (Transferred)" : ""
                      } - Read Only`
                }
              >
                {mark ?? ""}
                {isTransferred && (
                  <span className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-purple-600 text-[8px] text-white font-bold leading-none shadow-sm pointer-events-none">
                    T
                  </span>
                )}
                <span className="sr-only">(Transferred)</span>
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
