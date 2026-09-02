"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TicketPlus, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { grantExtraTokens } from "@/lib/api/client/tokens";

interface GrantTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: {
    id: string;
    offering: {
      title: string;
      term: {
        name: string;
      };
    };
  } | null;
  studentName: string;
  onSuccess?: () => void;
}

export function GrantTokensDialog({
  open,
  onOpenChange,
  enrollment,
  studentName,
  onSuccess,
}: GrantTokensDialogProps) {
  const [count, setCount] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enrollment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please provide a reason / note for granting extra tokens.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await grantExtraTokens({
        enrollmentId: enrollment.id,
        count: parseInt(count, 10),
        notes: notes.trim(),
      });

      toast.success(
        `Successfully granted ${count} makeup token${parseInt(count, 10) > 1 ? "s" : ""} to ${studentName}`,
      );
      setNotes("");
      setCount("1");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Failed to grant extra tokens:", err);
      const message = err instanceof Error ? err.message : "Failed to grant extra tokens";
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
          <div className="flex items-center gap-2 text-emerald-700">
            <TicketPlus className="h-5 w-5" />
            <DialogTitle>Grant Makeup Tokens</DialogTitle>
          </div>
          <DialogDescription>
            Add extra makeup tokens to <strong>{studentName}</strong> for this enrollment. This action requires an audit note.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Enrollment Context */}
          <div className="rounded-md border bg-slate-50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class:</span>
              <span className="font-medium text-slate-800">{enrollment.offering.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Term:</span>
              <span className="font-medium text-slate-800">{enrollment.offering.term.name}</span>
            </div>
          </div>

          {/* Token Count Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="token-count">Number of Tokens to Grant</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger id="token-count" className="w-full">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Token</SelectItem>
                <SelectItem value="2">2 Tokens</SelectItem>
                <SelectItem value="3">3 Tokens</SelectItem>
                <SelectItem value="4">4 Tokens</SelectItem>
                <SelectItem value="5">5 Tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mandatory Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="grant-notes">
              Staff Notes / Justification <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="grant-notes"
              placeholder="e.g. Medical exception, instructor absence compensation, supervisor approved..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError(null);
              }}
              className="h-24 resize-none"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be recorded in the audit log under your account.
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
              variant="success"
              disabled={loading || !notes.trim()}
              className="text-white font-medium shadow-sm"
            >
              {loading ? "Granting..." : `Grant ${count} Token${parseInt(count, 10) > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
