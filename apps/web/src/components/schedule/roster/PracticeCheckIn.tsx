"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Search,
  Waves,
  X,
  Clock,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getPracticeRoster,
  practiceCheckIn,
  PracticeRosterResponse,
} from "@/lib/api/client/attendance";

interface PracticeCheckInProps {
  sessionId: string;
  userRole?: string;
  onAttendanceChanged?: () => void;
}

export function PracticeCheckIn({
  sessionId,
  userRole,
  onAttendanceChanged,
}: PracticeCheckInProps) {
  const [data, setData] = useState<PracticeRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals for Grace Period and Delinquent Locks
  const [gracePromptSwimmer, setGracePromptSwimmer] = useState<{
    studentId: string;
    name: string;
    daysOverdue: number;
    amountDue: number;
  } | null>(null);

  const [lockPromptSwimmer, setLockPromptSwimmer] = useState<{
    studentId: string;
    name: string;
    daysOverdue: number;
    amountDue: number;
  } | null>(null);

  const isSupervisorOrAbove =
    userRole === "super_admin" ||
    userRole === "admin" ||
    userRole === "manager" ||
    userRole === "supervisor";

  const loadRoster = async () => {
    try {
      setLoading(true);
      const res = await getPracticeRoster(sessionId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load practice roster:", err);
      toast.error("Failed to load practice squad roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadRoster();
    }
  }, [sessionId]);

  const handleQuickCheckIn = async (swimmer: {
    studentId: string;
    name: string;
    paymentStatus: "PAID" | "OVERDUE_GRACE" | "LOCKED";
    daysOverdue: number;
    amountDue: number;
  }) => {
    if (!data) return;

    // Check pool capacity first
    if (data.checkedInCount >= data.capacity) {
      toast.error(`Pool capacity limit reached (${data.capacity} max swimmers).`);
      return;
    }

    if (swimmer.paymentStatus === "LOCKED") {
      setLockPromptSwimmer(swimmer);
      return;
    }

    if (swimmer.paymentStatus === "OVERDUE_GRACE") {
      setGracePromptSwimmer(swimmer);
      return;
    }

    // Normal Paid Swimmer Check-In
    setActionLoading(swimmer.studentId);
    try {
      await practiceCheckIn({
        classSessionId: sessionId,
        studentId: swimmer.studentId,
        status: "present",
      });
      toast.success(`${swimmer.name} checked into practice.`);
      await loadRoster();
      onAttendanceChanged?.();
    } catch (err: any) {
      console.error("Check in error:", err);
      toast.error(err?.message || "Check-in failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGraceAcknowledge = async () => {
    if (!gracePromptSwimmer) return;
    setActionLoading(gracePromptSwimmer.studentId);
    try {
      await practiceCheckIn({
        classSessionId: sessionId,
        studentId: gracePromptSwimmer.studentId,
        status: "present",
        acknowledgeOverdue: true,
      });
      toast.success(`${gracePromptSwimmer.name} checked in (Grace Period acknowledged).`);
      setGracePromptSwimmer(null);
      await loadRoster();
      onAttendanceChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Check-in failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSupervisorOverride = async () => {
    if (!lockPromptSwimmer) return;
    setActionLoading(lockPromptSwimmer.studentId);
    try {
      await practiceCheckIn({
        classSessionId: sessionId,
        studentId: lockPromptSwimmer.studentId,
        status: "present",
        overrideDelinquency: true,
      });
      toast.success(
        `Supervisor override granted for ${lockPromptSwimmer.name}.`
      );
      setLockPromptSwimmer(null);
      await loadRoster();
      onAttendanceChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Supervisor override failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmark = async (studentId: string, name: string) => {
    setActionLoading(studentId);
    try {
      await practiceCheckIn({
        classSessionId: sessionId,
        studentId,
        status: null,
      });
      toast.info(`Removed ${name} from practice.`);
      await loadRoster();
      onAttendanceChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove check-in.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter eligible swimmers by search
  const filteredEligible = useMemo(() => {
    if (!data?.eligibleSwimmers) return [];
    if (!searchQuery.trim()) return data.eligibleSwimmers;
    const query = searchQuery.toLowerCase();
    return data.eligibleSwimmers.filter((s) =>
      s.name.toLowerCase().includes(query)
    );
  }, [data?.eligibleSwimmers, searchQuery]);

  if (loading && !data) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Loading practice squad roster...</span>
      </div>
    );
  }

  if (!data) return null;

  const isAtCapacity = data.checkedInCount >= data.capacity;
  const capacityPercent = Math.min(
    100,
    Math.round((data.checkedInCount / data.capacity) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Live Capacity Bar */}
      <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">
              Pool Deck Attendance
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              {data.checkedInCount} / {data.capacity} In Pool
            </span>
            {isAtCapacity ? (
              <Badge variant="destructive" className="text-xs">
                Capacity Reached
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
                {data.capacity - data.checkedInCount} Slots Open
              </Badge>
            )}
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtCapacity
                ? "bg-rose-600"
                : capacityPercent > 80
                ? "bg-amber-500"
                : "bg-blue-600"
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Currently In Water / Checked In */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Swimmers In Practice ({data.checkedIn.length})
          </h4>
        </div>

        {data.checkedIn.length === 0 ? (
          <div className="p-4 border rounded-md border-dashed text-center text-xs text-muted-foreground bg-white">
            No swimmers checked in yet. Tap any eligible squad member below to check them into the pool.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {data.checkedIn.map((swimmer) => (
              <div
                key={swimmer.studentId}
                className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-md text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">
                    {swimmer.name}
                  </span>
                  {swimmer.acknowledgedOverdue && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0 px-1">
                      Grace
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actionLoading === swimmer.studentId}
                  onClick={() => handleUnmark(swimmer.studentId, swimmer.name)}
                  className="h-7 px-2 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Remove from practice"
                >
                  {actionLoading === swimmer.studentId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eligible Squad Check-In Grid */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Eligible Squad Swimmers ({filteredEligible.length})
          </h4>

          {/* Quick Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search swimmer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {filteredEligible.length === 0 ? (
          <div className="p-4 border rounded-md border-dashed text-center text-xs text-muted-foreground bg-white">
            {searchQuery ? "No matching squad swimmers found." : "All eligible squad swimmers are checked in!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
            {filteredEligible.map((swimmer) => {
              const isLocked = swimmer.paymentStatus === "LOCKED";
              const isGrace = swimmer.paymentStatus === "OVERDUE_GRACE";
              const isBusy = actionLoading === swimmer.studentId;

              return (
                <button
                  key={swimmer.studentId}
                  type="button"
                  disabled={isBusy || (isAtCapacity && !isLocked)}
                  onClick={() => handleQuickCheckIn(swimmer)}
                  className={`flex flex-col text-left p-2.5 rounded-md border transition-all duration-150 relative ${
                    isLocked
                      ? "bg-rose-50/60 border-rose-200 hover:border-rose-400 text-rose-950"
                      : isGrace
                      ? "bg-amber-50/60 border-amber-200 hover:border-amber-400 text-amber-950"
                      : "bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 text-slate-800"
                  } ${isAtCapacity ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm truncate pr-1">
                      {swimmer.name}
                    </span>

                    {isLocked ? (
                      <span className="p-1 rounded bg-rose-100 text-rose-700 shrink-0">
                        <Lock className="w-3 h-3" />
                      </span>
                    ) : isGrace ? (
                      <span className="p-1 rounded bg-amber-100 text-amber-700 shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-blue-50 text-blue-600 shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Status subtitle */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{swimmer.level || "Squad Member"}</span>
                    {isLocked ? (
                      <span className="text-rose-600 font-medium">
                        Delinquent ({swimmer.daysOverdue}d)
                      </span>
                    ) : isGrace ? (
                      <span className="text-amber-700 font-medium">
                        Unpaid ({swimmer.daysOverdue}d)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Current</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grace Period Acknowledgment Modal */}
      <Dialog
        open={Boolean(gracePromptSwimmer)}
        onOpenChange={(open) => !open && setGracePromptSwimmer(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Fee Overdue (Grace Period)</DialogTitle>
                <DialogDescription>Staff Acknowledgment Required</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">{gracePromptSwimmer?.name}</span> has an
              unpaid monthly practice fee balance of{" "}
              <span className="font-bold text-amber-900">
                ${gracePromptSwimmer?.amountDue.toFixed(2)}
              </span>{" "}
              that is {gracePromptSwimmer?.daysOverdue} days past due (within 10-day grace).
            </p>
            <p className="text-xs text-muted-foreground bg-slate-50 p-2.5 rounded border">
              Staff acknowledgment will admit the swimmer for today&apos;s practice and log
              an audit record.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setGracePromptSwimmer(null)}
              disabled={Boolean(actionLoading)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGraceAcknowledge}
              disabled={Boolean(actionLoading)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : null}
              Acknowledge & Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delinquent Hard Lock / Supervisor Override Modal */}
      <Dialog
        open={Boolean(lockPromptSwimmer)}
        onOpenChange={(open) => !open && setLockPromptSwimmer(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Account Delinquent & Locked</DialogTitle>
                <DialogDescription>Overdue &gt; 10 Days Past Due</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900 space-y-1">
              <div className="font-semibold">Check-in blocked for this swimmer:</div>
              <div>
                {lockPromptSwimmer?.name} is {lockPromptSwimmer?.daysOverdue} days overdue
                with an outstanding balance of{" "}
                <span className="font-bold">${lockPromptSwimmer?.amountDue.toFixed(2)}</span>.
              </div>
            </div>

            {isSupervisorOrAbove ? (
              <p className="text-xs text-muted-foreground">
                As a supervisor or above, you may grant a temporary emergency override to
                allow the swimmer into practice today. This action is permanently logged.
              </p>
            ) : (
              <p className="text-xs text-rose-700 font-medium">
                Standard staff cannot admit this swimmer. A supervisor or manager must
                perform the check-in override.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLockPromptSwimmer(null)}
              disabled={Boolean(actionLoading)}
            >
              Close
            </Button>
            {isSupervisorOrAbove && (
              <Button
                onClick={handleSupervisorOverride}
                disabled={Boolean(actionLoading)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : null}
                Grant Supervisor Override
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
