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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { assignInstructor, removeInstructor, getStaffUsers } from '@/lib/api/instructor-client';
import type { InstructorInfo } from '@school/shared-types';

interface AssignInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classOfferingId: string;
  currentInstructors: InstructorInfo[];
  onSuccess: () => void;
  levelName: string;
}

export function AssignInstructorDialog({
  open,
  onOpenChange,
  classOfferingId,
  currentInstructors,
  onSuccess,
  levelName,
}: AssignInstructorDialogProps) {
  const [staffUsers, setStaffUsers] = useState<Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    active: boolean;
  }>>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadStaffUsers();
    }
  }, [open]);

  const loadStaffUsers = async () => {
    try {
      setLoadingStaff(true);
      setError(null);
      const users = await getStaffUsers();
      // Filter to only active staff
      setStaffUsers(users.filter(u => u.active));
    } catch (error) {
      setError('Failed to load staff users');
      console.error(error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;

    try {
      setLoading(true);
      setError(null);
      await assignInstructor(classOfferingId, selectedStaffId);
      setSelectedStaffId('');
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign instructor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId: string, staffName: string) => {
    try {
      setLoading(true);
      setError(null);
      await removeInstructor(assignmentId);
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove instructor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out already assigned instructors from dropdown
  const availableStaff = staffUsers.filter(
    staff => !currentInstructors.some(inst => inst.staffUserId === staff.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Instructors</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {levelName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Current Instructors */}
          <div>
            <Label className="text-sm font-medium">Current Instructors</Label>
            {currentInstructors.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No instructors assigned</p>
            ) : (
              <div className="mt-2 space-y-2">
                {currentInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium">{instructor.staffName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(instructor.id, instructor.staffName)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Instructor */}
          <div className="space-y-2">
            <Label htmlFor="staff-select">Add Instructor</Label>
            {loadingStaff ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="staff-select">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No available staff members
                    </div>
                  ) : (
                    availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullName} ({staff.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <Button onClick={handleAssign} disabled={!selectedStaffId || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Instructor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}