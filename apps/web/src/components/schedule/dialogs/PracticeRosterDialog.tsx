"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PracticeCheckIn } from "../roster/PracticeCheckIn";
import { Waves } from "lucide-react";

interface PracticeRosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  title?: string;
  dateStr?: string;
  timeStr?: string;
  userRole?: string;
  onAttendanceChanged?: () => void;
}

export function PracticeRosterDialog({
  open,
  onOpenChange,
  sessionId,
  title = "Competitive Practice",
  dateStr,
  timeStr,
  userRole,
  onAttendanceChanged,
}: PracticeRosterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{title} • Deck Check-In</DialogTitle>
              <DialogDescription>
                {dateStr ? `${dateStr} • ` : ""}
                {timeStr ? `${timeStr} • ` : ""}
                Drop-in attendance roster
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sessionId && (
          <div className="pt-2">
            <PracticeCheckIn
              sessionId={sessionId}
              userRole={userRole}
              onAttendanceChanged={onAttendanceChanged}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
