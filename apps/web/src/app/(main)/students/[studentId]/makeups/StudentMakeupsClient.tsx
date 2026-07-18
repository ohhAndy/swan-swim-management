"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  StickyNote,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types/models";
import type { CurrentUser } from "@/lib/auth/user";

/** Serialized Term shape from the API (dates are strings) */
type SerializedTerm = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  locationId: string | null;
  slug: string | null;
  location: { name: string } | null;
};
import { FULL_DAY_LABELS, formatTime } from "@/lib/schedule/slots";

interface StudentMakeupsClientProps {
  student: Student;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  terms: SerializedTerm[];
  user: CurrentUser;
}

type MakeUp = Student["makeUps"][number];

function getStatusConfig(status: string) {
  switch (status) {
    case "attended":
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: "Attended",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case "missed":
      return {
        icon: <XCircle className="h-4 w-4" />,
        label: "Missed",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    case "cancelled":
      return {
        icon: <XCircle className="h-4 w-4" />,
        label: "Cancelled",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    case "requested":
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Requested",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        label: status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MakeupCard({ makeup }: { makeup: MakeUp }) {
  const statusConfig = getStatusConfig(makeup.status);
  const offering = makeup.classSession.offering;
  const sessionDate = makeup.classSession.date;

  const canLink =
    offering.termId &&
    offering.weekday !== null &&
    offering.startTime &&
    offering.endTime;

  const href = canLink
    ? `/term/${offering.termId}/schedule/weekday/${offering.weekday}/slot/${offering.startTime}-${offering.endTime}?highlight=${offering.id}`
    : null;

  const cardInner = (
    <>
      {/* Date accent */}
      <div className="flex flex-col items-center justify-center min-w-[52px] rounded-lg bg-primary/5 border border-primary/10 px-2 py-3 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {new Date(sessionDate).toLocaleDateString("en-CA", {
            timeZone: "UTC",
            month: "short",
          })}
        </span>
        <span className="text-2xl font-bold leading-none text-foreground mt-0.5">
          {new Date(sessionDate).toLocaleDateString("en-CA", {
            timeZone: "UTC",
            day: "numeric",
          })}
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {new Date(sessionDate).toLocaleDateString("en-CA", {
            timeZone: "UTC",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground truncate">
              {offering.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {offering.weekday !== null && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {FULL_DAY_LABELS[offering.weekday]}
                </span>
              )}
              {offering.startTime && offering.endTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(offering.startTime)} –{" "}
                  {formatTime(offering.endTime)}
                </span>
              )}
            </div>
          </div>

          <Badge
            className={`flex items-center gap-1 shrink-0 border text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Notes */}
        {makeup.notes && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground italic">
            <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {makeup.notes}
          </p>
        )}

        {/* Booked date */}
        <p className="mt-2 text-xs text-muted-foreground/70">
          Booked:{" "}
          {new Date(makeup.createdAt).toLocaleDateString("en-CA", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </>
  );

  const sharedClass =
    "group flex items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30";

  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {cardInner}
      </Link>
    );
  }

  return <div className={sharedClass}>{cardInner}</div>;
}


export default function StudentMakeupsClient({
  student,
  terms,
}: StudentMakeupsClientProps) {
  const router = useRouter();
  const makeups = student.makeUps;

  // Build termId -> term lookup
  const termMap = new Map<string, SerializedTerm>(terms.map((t) => [t.id, t]));

  // Group makeups by termId, then sort groups by term start date (newest first)
  const grouped = makeups.reduce<Map<string, MakeUp[]>>((acc, m) => {
    const termId = m.classSession.offering.termId ?? "unknown";
    if (!acc.has(termId)) acc.set(termId, []);
    acc.get(termId)!.push(m);
    return acc;
  }, new Map());

  // Sort each group's makeups by session date descending
  grouped.forEach((list) => {
    list.sort(
      (a, b) =>
        new Date(b.classSession.date).getTime() -
        new Date(a.classSession.date).getTime()
    );
  });

  // Sort groups: terms with known start date newest first, unknown at end
  const sortedGroups = [...grouped.entries()].sort(([aId], [bId]) => {
    const aTerm = termMap.get(aId);
    const bTerm = termMap.get(bId);
    if (!aTerm && !bTerm) return 0;
    if (!aTerm) return 1;
    if (!bTerm) return -1;
    return (
      new Date(bTerm.startDate).getTime() - new Date(aTerm.startDate).getTime()
    );
  });

  // Stats
  const totalMakeups = makeups.length;
  const attended = makeups.filter((m) => m.status === "attended").length;
  const scheduled = makeups.filter((m) => m.status === "scheduled").length;
  const missed = makeups.filter((m) => m.status === "missed").length;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <button
          onClick={() => router.push("/students")}
          className="hover:text-foreground transition-colors"
        >
          Students
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/students/${student.id}`}
          className="hover:text-foreground transition-colors"
        >
          {student.firstName} {student.lastName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Make-ups</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Make-up History
          </h1>
          <p className="text-muted-foreground mt-1">
            All make-up sessions for{" "}
            <span className="font-medium text-foreground">
              {student.firstName} {student.lastName}
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/students/${student.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student
          </Link>
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Total",
            value: totalMakeups,
            icon: <RefreshCw className="h-4 w-4" />,
            className: "bg-slate-50 border-slate-200",
            valueClass: "text-foreground",
          },
          {
            label: "Scheduled",
            value: scheduled,
            icon: <AlertCircle className="h-4 w-4" />,
            className: "bg-blue-50 border-blue-200",
            valueClass: "text-blue-700",
          },
          {
            label: "Attended",
            value: attended,
            icon: <CheckCircle2 className="h-4 w-4" />,
            className: "bg-emerald-50 border-emerald-200",
            valueClass: "text-emerald-700",
          },
          {
            label: "Missed",
            value: missed,
            icon: <XCircle className="h-4 w-4" />,
            className: "bg-red-50 border-red-200",
            valueClass: "text-red-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-3 ${stat.className}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
              <span className={`${stat.valueClass} opacity-60`}>
                {stat.icon}
              </span>
            </div>
            <p className={`mt-1 text-2xl font-bold ${stat.valueClass}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      {makeups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground">
              No make-ups yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {student.firstName} hasn&apos;t had any make-up sessions booked.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([termId, termMakeups]) => {
            const term = termMap.get(termId);
            const termName = term?.name ?? "Unknown Term";

            return (
              <div key={termId}>
                {/* Term header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-base font-semibold text-foreground">
                      {termName}
                    </h2>
                    {term?.location?.name && (
                      <span className="text-xs text-muted-foreground font-normal">
                        · {term.location.name}
                      </span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {termMakeups.length}{" "}
                    {termMakeups.length === 1 ? "session" : "sessions"}
                  </Badge>
                </div>

                {/* Makeup cards */}
                <div className="space-y-3">
                  {termMakeups.map((makeup) => (
                    <MakeupCard key={makeup.id} makeup={makeup} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
