"use client";

import { useState } from "react";
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
import { createOffering } from "@/lib/api/schedule-client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface AddClassDialogProps {
  termId: string;
  weekday: number;
  startTime: string; // HH:MM
  onSuccess?: () => void;
}

export function AddClassDialog({
  termId,
  weekday,
  startTime,
  onSuccess,
}: AddClassDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("3");

  async function handleCreate() {
    if (!title) return;

    setLoading(true);
    try {
      await createOffering({
        termId,
        weekday,
        startTime,
        title,
        capacity: parseInt(capacity) || 3,
      });
      setOpen(false);
      setTitle("");
      setCapacity("3");
      startTransition(() => {
        router.refresh();
      });
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert("Failed to create class");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Class - {startTime}</DialogTitle>
          <DialogDescription>
            Create a new class offering for this time slot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title (Level)</Label>
            <Input
              id="title"
              placeholder="e.g. Preschool A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">Capacity</Label>
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
            {loading || isPending ? "Creating..." : "Create Class"}
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
