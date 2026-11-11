"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { createOffering } from "@/lib/api/client/schedule";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatTime } from "@/lib/schedule/slots";

interface AddClassDialogProps {
  termId: string;
  weekday: number;
  startTime?: string; // HH:MM
  duration?: number;
  /** "swim_team" creates a practice in a swim team season */
  offeringType?: "regular" | "swim_team";
  onSuccess?: () => void;
}

export function AddClassDialog({
  termId,
  weekday,
  startTime,
  duration,
  offeringType = "regular",
  onSuccess,
}: AddClassDialogProps) {
  const isPractice = offeringType === "swim_team";
  const defaultCapacity = isPractice ? "12" : "3";
  const defaultDuration = isPractice ? "60" : "45";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [customTime, setCustomTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(
    duration?.toString() || defaultDuration,
  );

  async function handleCreate() {
    if (!title) return;
    const timeToUse = startTime || customTime;
    if (!timeToUse) return;

    setLoading(true);
    try {
      await createOffering({
        termId,
        type: offeringType,
        weekday,
        startTime: timeToUse,
        title,
        capacity: parseInt(capacity) || Number(defaultCapacity),
        duration: parseInt(durationMinutes) || Number(defaultDuration),
      });
      setOpen(false);
      setTitle("");
      setCapacity(defaultCapacity);
      setDurationMinutes(duration?.toString() || defaultDuration);
      startTransition(() => {
        router.refresh();
      });
      onSuccess?.();
      toast.success(
        isPractice ? "Practice created successfully" : "Class created successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : isPractice
            ? "Failed to create practice"
            : "Failed to create class",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={startTime ? "default" : "outline"}
          className={startTime ? "gap-2" : "gap-2 w-full mt-2 border-dashed"}
        >
          <Plus className="h-4 w-4" />
          {startTime ? (isPractice ? "Add Practice" : "Add Class") : "Add Slot"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {startTime
              ? `${isPractice ? "Add Practice" : "Add Class"} - ${formatTime(startTime)}`
              : isPractice
                ? "Add Practice Time"
                : "Add New Time Slot"}
          </DialogTitle>
          <DialogDescription>
            {isPractice
              ? "Create a weekly swim team practice. It repeats every week until the season ends."
              : "Create a new class offering for this time slot."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!startTime && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customTime">Time</Label>
                <Input
                  id="customTime"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (mins)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="title">
              {isPractice ? "Practice group" : "Title (Level)"}
            </Label>
            <Input
              id="title"
              placeholder={isPractice ? "e.g. Junior Squad" : "e.g. Preschool A"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">
              {isPractice ? "Capacity (swimmers)" : "Capacity"}
            </Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || isPending || !title}
          >
            {loading || isPending
              ? "Creating..."
              : isPractice
                ? "Create Practice"
                : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-5 shadow-md border border-gray-200">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <p className="text-sm font-medium text-gray-700">Updating…</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
