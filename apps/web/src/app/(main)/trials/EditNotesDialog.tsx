'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { updateTrialNotes } from '@/lib/api/trial-client';

interface EditNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trial: {
    id: string;
    childName: string;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

export function EditNotesDialog({
  open,
  onOpenChange,
  trial,
  onSuccess,
}: EditNotesDialogProps) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && trial) {
      setNotes(trial.notes || '');
      setError(null);
    } else {
      setNotes('');
      setError(null);
    }
  }, [open, trial]);

  const handleSave = async () => {
    if (!trial) return;

    try {
      setSaving(true);
      setError(null);
      await updateTrialNotes(trial.id, notes.trim() || null);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  if (!trial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Trial Notes</DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            Edit notes for {trial.childName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4 text-left">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter trial notes..."
              rows={4}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
