"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Composer } from "@/components/communications/Composer";
import { sendEmail } from "@/lib/api/communications-client";
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
  // Wrapper to handle closing on success if we want, or just let Composer handle success state
  // Composer has its own success state ("Email Queued Successfully"), so we can just let it handle it.
  // But if we want to close the dialog after a delay or reset when reopening, we might need a wrapper.
  // For now, let's just render the Composer. When the dialog closes and re-opens, we want a fresh state.
  // We can force re-render with a key or just let the Composer handle its internal state.

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
