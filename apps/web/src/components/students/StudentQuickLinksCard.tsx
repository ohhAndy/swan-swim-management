import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ChevronRight, Ticket, AlertTriangle } from "lucide-react";
import type { Student } from "@/lib/types/models";
import { Badge } from "@/components/ui/badge";

interface StudentQuickLinksCardProps {
  student: Student;
}

export function StudentQuickLinksCard({ student }: StudentQuickLinksCardProps) {
  const now = new Date();

  // Compute active token summary across all active enrollments
  const activeEnrollments = (student.enrollments || []).filter(
    (e) => e.status === "active",
  );

  let totalTokens = 0;
  let availableTokens = 0;
  let consumedTokens = 0;

  for (const enr of activeEnrollments) {
    const termEnd = enr.offering?.term?.endDate;
    const isTermEnded = termEnd ? new Date(termEnd) < now : false;

    const tokens = enr.makeUpTokens || [];
    for (const t of tokens) {
      totalTokens++;
      if (t.status === "consumed") {
        consumedTokens++;
      } else if (t.status === "available") {
        if (!isTermEnded) {
          availableTokens++;
        }
      }
    }
  }

  // Count active overrides (excluding cancelled)
  const overrideCount = (student.makeUps || []).filter(
    (m) => m.isOverride === true && m.status !== "cancelled",
  ).length;

  const totalMakeups = student.makeUps?.length || 0;
  const progressPercent =
    totalTokens > 0
      ? Math.round((availableTokens / totalTokens) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Link
          href={`/students/${student.id}/makeups`}
          className="flex flex-col gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors group border-t first:border-t-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 group-hover:text-blue-600 font-medium">
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span>Make-up History</span>
              {totalMakeups > 0 && (
                <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700">
                  {totalMakeups}
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>

          {/* Token Balance Indicator */}
          {totalTokens > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Ticket className="h-3.5 w-3.5 text-blue-600" />
                  {availableTokens} of {totalTokens} tokens available
                </span>
                <span>{consumedTokens} used</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    availableTokens > 0 ? "bg-blue-600" : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
              <Ticket className="h-3 w-3 text-slate-400" />
              <span>No tokens in current term</span>
            </div>
          )}

          {/* Accountability / Override Alert */}
          {overrideCount > 0 && (
            <div className="pt-1">
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-medium flex items-center gap-1 py-0.5 px-2 w-fit"
              >
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                {overrideCount} override makeup{overrideCount > 1 ? "s" : ""} booked
              </Badge>
            </div>
          )}
        </Link>
      </CardContent>
    </Card>
  );
}
