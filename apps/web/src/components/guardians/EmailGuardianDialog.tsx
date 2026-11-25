"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Composer } from "@/components/communications/Composer";
import { sendEmail } from "@/lib/api/client/communications";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface EmailGuardianDialogProps {
  guardianName: string;
  guardianEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailGuardianDialog({
  guardianName,
  guardianEmail,
  open,
  onOpenChange,
}: EmailGuardianDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <VisuallyHidden>
          <DialogTitle>Email to {guardianName}</DialogTitle>
        </VisuallyHidden>
        <div className="p-0">
          {/* We rely on Composer's internal success state for UI feedback. */}
          <Composer
            recipientCount={1}
            recipientEmails={[guardianEmail]}
            recipientLabel={`${guardianName} <${guardianEmail}>`}
            onSend={sendEmail}
            title={`Email to ${guardianName}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
