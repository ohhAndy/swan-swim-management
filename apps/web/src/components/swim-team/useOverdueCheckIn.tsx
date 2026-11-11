"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { upsertAttendance } from "@/lib/api/client/attendance";
import { ApiError } from "@/lib/api/error";
import { formatCalendarDay, formatSwimTeamMoney } from "./SwimTeamBadges";

type AttendanceValue = "present" | "absent" | "excused" | "";

interface PendingConfirm {
  swimmerName: string;
  behindAmount: number | null;
  nextDueDate: string | null;
}

function parseBehindError(error: unknown): {
  behindAmount: number | null;
  nextDueDate: string | null;
} | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  try {
    const body: unknown = JSON.parse(error.rawMessage ?? "");
    if (
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      body.code === "SWIM_TEAM_PAYMENT_BEHIND"
    ) {
      const amount = "behindAmount" in body ? body.behindAmount : null;
      const due = "nextDueDate" in body ? body.nextDueDate : null;
      return {
        behindAmount: typeof amount === "number" ? amount : null,
        nextDueDate: typeof due === "string" ? due : null,
      };
    }
  } catch {
    // Not the structured error we are looking for
  }
  return null;
}

/**
 * Marks attendance for a swim team member. When the swimmer is behind on
 * their payment plan the API refuses the check-in; this asks staff to confirm
 * and retries with the acknowledgement.
 *
 * `markAttendance` resolves to true when the mark was saved, false when staff
 * cancelled. Render `dialog` once in the calling component.
 */
export function useOverdueCheckIn() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setPending(null);
  }, []);

  const markAttendance = useCallback(
    async (
      enrollmentId: string,
      sessionId: string,
      status: AttendanceValue,
      swimmerName: string,
    ): Promise<boolean> => {
      try {
        await upsertAttendance(enrollmentId, sessionId, status);
        return true;
      } catch (error) {
        const behind = parseBehindError(error);
        if (!behind) throw error;

        const confirmed = await new Promise<boolean>((resolve) => {
          resolver.current = resolve;
          setPending({ swimmerName, ...behind });
        });
        if (!confirmed) return false;

        await upsertAttendance(enrollmentId, sessionId, status, true);
        return true;
      }
    },
    [],
  );

  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pending?.swimmerName} is behind on payments
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.behindAmount !== null && pending?.behindAmount !== undefined
              ? `${formatSwimTeamMoney(pending.behindAmount)} of their installment plan is past due.`
              : "Part of their installment plan is past due."}{" "}
            {pending?.nextDueDate
              ? `The next installment is due ${formatCalendarDay(pending.nextDueDate, { month: "long", day: "numeric" })}. `
              : ""}
            Check them in anyway? This will be recorded.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            Don&apos;t check in
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>
            Check in anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { markAttendance, dialog };
}
