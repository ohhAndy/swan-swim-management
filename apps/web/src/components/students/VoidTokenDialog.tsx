"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { voidToken } from "@/lib/api/client/tokens";
import type { TokenInfo } from "@school/shared-types";

interface VoidTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenInfo | null;
  studentName: string;
  termName?: string;
  onSuccess?: () => void;
}

export function VoidTokenDialog({
  open,
  onOpenChange,
  token,
  studentName,
  termName,
  onSuccess,
}: VoidTokenDialogProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please provide a reason for voiding this token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await voidToken(token.id, notes.trim());

      toast.success(`Successfully voided makeup token for ${studentName}`);
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to void token:", err);
      const message = err instanceof Error ? err.message : "Failed to void token";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            <DialogTitle>Void Makeup Token</DialogTitle>
          </div>
          <DialogDescription>
            Revoke this available makeup token from <strong>{studentName}</strong>. This action cannot be undone and will be logged in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Token Context */}
          <div className="rounded-md border bg-slate-50 p-3 text-xs space-y-1">
            {termName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Term:</span>
                <span className="font-medium text-slate-800">{termName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grant Source:</span>
              <span className="font-medium text-slate-800">
                {token.isAutoGranted
                  ? "Auto-granted on enrollment"
                  : `Manually granted by ${token.grantedBy || "Staff"}`}
              </span>
            </div>
            {token.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grant Notes:</span>
                <span className="font-medium text-slate-700 italic">{token.notes}</span>
              </div>
            )}
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="void-notes">
              Reason for Voiding <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="void-notes"
              placeholder="e.g. Granted by mistake, student un-enrolled, duplicate issue..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError(null);
              }}
              className="h-24 resize-none"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be recorded in the audit log under your name.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !notes.trim()}
              className="font-medium shadow-sm"
            >
              {loading ? "Voiding..." : "Confirm Void Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
