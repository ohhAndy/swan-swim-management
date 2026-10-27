"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Trophy, AlertCircle, Calendar, DollarSign, MapPin, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMembership, updateMembership, StudentMembership } from "@/lib/api/client/memberships";
import { getTerms, Term } from "@/lib/api/client/term";

interface RegisterMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  existingMembership?: StudentMembership | null;
  onSuccess?: () => void;
}

export function RegisterMembershipDialog({
  open,
  onOpenChange,
  student,
  existingMembership,
  onSuccess,
}: RegisterMembershipDialogProps) {
  const isEditing = Boolean(existingMembership);

  const [terms, setTerms] = useState<Term[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [seasonTermId, setSeasonTermId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [annualRegFee, setAnnualRegFee] = useState<string>("150.00");
  const [monthlyPracticeFee, setMonthlyPracticeFee] = useState<string>("220.00");
  const [status, setStatus] = useState<"active" | "paused" | "cancelled">("active");
  const [annualRegPaid, setAnnualRegPaid] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingData(true);

    getTerms()
      .then((fetchedTerms) => {
        setTerms(fetchedTerms || []);

        if (existingMembership) {
          setSeasonTermId(existingMembership.seasonTermId);
          setStartDate(
            existingMembership.startDate ? existingMembership.startDate.split("T")[0] : ""
          );
          setEndDate(
            existingMembership.endDate ? existingMembership.endDate.split("T")[0] : ""
          );
          setAnnualRegFee(Number(existingMembership.annualRegFee || 0).toFixed(2));
          setMonthlyPracticeFee(Number(existingMembership.monthlyPracticeFee || 0).toFixed(2));
          setStatus(existingMembership.status || "active");
          setAnnualRegPaid(Boolean(existingMembership.annualRegPaid));
          setNotes(existingMembership.notes || "");
        } else {
          // Pre-select active or latest term
          if (fetchedTerms && fetchedTerms.length > 0) {
            const defaultTerm = fetchedTerms[0];
            setSeasonTermId(defaultTerm.id);
            if (defaultTerm.startDate) {
              setStartDate(new Date(defaultTerm.startDate).toISOString().split("T")[0]);
            }
            if (defaultTerm.endDate) {
              setEndDate(new Date(defaultTerm.endDate).toISOString().split("T")[0]);
            }
          }
          setAnnualRegFee("150.00");
          setMonthlyPracticeFee("220.00");
          setStatus("active");
          setAnnualRegPaid(false);
          setNotes("");
        }
      })
      .catch((err) => {
        console.error("Failed to load season terms:", err);
        setError("Failed to load season terms.");
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [open, existingMembership]);

  const selectedTerm = useMemo(() => {
    return terms.find((t) => t.id === seasonTermId);
  }, [terms, seasonTermId]);

  const handleTermChange = (termId: string) => {
    setSeasonTermId(termId);
    const chosen = terms.find((t) => t.id === termId);
    if (chosen) {
      if (chosen.startDate) {
        setStartDate(new Date(chosen.startDate).toISOString().split("T")[0]);
      }
      if (chosen.endDate) {
        setEndDate(new Date(chosen.endDate).toISOString().split("T")[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const regFeeNum = parseFloat(annualRegFee);
    const practiceFeeNum = parseFloat(monthlyPracticeFee);

    if (isNaN(regFeeNum) || regFeeNum < 0) {
      setError("Please enter a valid annual registration fee (>= 0).");
      return;
    }
    if (isNaN(practiceFeeNum) || practiceFeeNum < 0) {
      setError("Please enter a valid monthly practice fee (>= 0).");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    const locId = selectedTerm?.locationId || existingMembership?.seasonTerm?.location?.id;
    const locationIds = locId ? [locId] : [];

    setSubmitting(true);
    try {
      if (isEditing && existingMembership) {
        await updateMembership(existingMembership.id, {
          status,
          monthlyPracticeFee: practiceFeeNum,
          annualRegFee: regFeeNum,
          annualRegPaid,
          allowedLocationIds: locationIds,
          endDate: endDate || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Competitive membership updated successfully.");
      } else {
        if (!seasonTermId) {
          setError("Please select a season term.");
          setSubmitting(false);
          return;
        }
        await createMembership({
          studentId: student.id,
          seasonTermId,
          startDate,
          endDate: endDate || undefined,
          annualRegFee: regFeeNum,
          monthlyPracticeFee: practiceFeeNum,
          allowedLocationIds: locationIds,
          notes: notes.trim() || undefined,
        });
        toast.success(`${student.firstName} registered for Competitive Swim Team!`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Membership save error:", err);
      setError(err?.message || "Failed to save membership. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? "Manage Swim Team Membership" : "Register for Swim Team"}
              </DialogTitle>
              <DialogDescription>
                {student.firstName} {student.lastName} • Competitive Training Squad
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">Loading season information...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Season Term Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="seasonTerm">Season Term</Label>
              {isEditing ? (
                <div className="p-2.5 bg-slate-50 border rounded-md text-sm font-medium text-slate-700">
                  {existingMembership?.seasonTerm?.name || "Competitive Season"}
                </div>
              ) : (
                <Select value={seasonTermId} onValueChange={handleTermChange}>
                  <SelectTrigger id="seasonTerm">
                    <SelectValue placeholder="Select competitive season..." />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name} {term.location?.name ? `(${term.location.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Facility Location (Inherited directly from Season Term) */}
            <div className="p-3 bg-slate-50 border rounded-md flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Practice Facility:</span>
              </div>
              <span className="font-semibold text-slate-900">
                {selectedTerm?.location?.name ||
                  existingMembership?.seasonTerm?.location?.name ||
                  "Assigned by Season Term"}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="annualRegFee" className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  Annual Reg Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                  <Input
                    id="annualRegFee"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-6"
                    value={annualRegFee}
                    onChange={(e) => setAnnualRegFee(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyPracticeFee" className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  Monthly Practice Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                  <Input
                    id="monthlyPracticeFee"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-6"
                    value={monthlyPracticeFee}
                    onChange={(e) => setMonthlyPracticeFee(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Editing Controls: Status & Reg Fee Paid Checkbox */}
            {isEditing && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Membership Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: "active" | "paused" | "cancelled") => setStatus(val)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused (Suspended)</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="annualRegPaid"
                    checked={annualRegPaid}
                    onCheckedChange={(checked) => setAnnualRegPaid(Boolean(checked))}
                  />
                  <Label htmlFor="annualRegPaid" className="text-xs cursor-pointer">
                    Annual Reg Fee Marked Paid
                  </Label>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Special Arrangements</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes regarding team squad, tier discounts, or schedule arrangements..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Register Swimmer"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
