import { Level } from "@/lib/api/curriculum-client";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, HelpCircle } from "lucide-react";

interface ReportCardTemplateProps {
  studentName: string;
  level: Level;
  skillGrades: Record<string, string>;
  comments?: string;
  instructorName?: string;
  termName?: string;
  className?: string; // For adding print-specific styles
}

export function ReportCardTemplate({
  studentName,
  level,
  skillGrades,
  comments,
  instructorName,
  termName,
  className,
}: ReportCardTemplateProps) {
  // Define colors to ensure html2canvas compatibility (no oklch/lab)
  const colors = {
    slate50: "#f8fafc",
    slate100: "#f1f5f9",
    slate200: "#e2e8f0",
    slate400: "#94a3b8",
    slate500: "#64748b",
    slate700: "#334155",
    slate900: "#0f172a",

    gray200: "#e5e7eb",
    gray900: "#111827",

    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue400: "#60a5fa",
    blue600: "#2563eb",
    blue700: "#1d4ed8",

    cyan100: "#cffafe",
    cyan400: "#22d3ee",

    green50: "#f0fdf4",
    green100: "#dcfce7",
    green500: "#22c55e",
    green700: "#15803d",

    amber50: "#fffbeb",
    amber100: "#fef3c7",
    amber400: "#fbbf24",
    amber700: "#b45309",

    white: "#ffffff",
  };

  return (
    <div
      id="report-card-template"
      className={cn(
        "w-[210mm] min-h-[297mm] mx-auto relative overflow-hidden print:overflow-visible flex flex-col print:mx-auto print:p-0",
        className,
      )}
      style={{
        fontFamily: "Inter, sans-serif",
        background: `linear-gradient(to bottom right, ${colors.slate50}, rgba(239, 246, 255, 0.3))`, // slate-50 to blue-50/30
        color: colors.slate900,
      }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-0 left-0 w-full h-2 print:hidden"
        style={{
          background: `linear-gradient(to right, ${colors.blue400}, ${colors.cyan400})`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-2 print:hidden"
        style={{
          background: `linear-gradient(to right, ${colors.blue400}, ${colors.cyan400})`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 print:hidden"
        style={{ backgroundColor: "rgba(219, 234, 254, 0.5)" }} // blue-100/50
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2 print:hidden"
        style={{ backgroundColor: "rgba(207, 250, 254, 0.5)" }} // cyan-100/50
      />

      <div className="p-8 md:p-12 print:p-8 grow flex flex-col relative z-10">
        {/* Header */}
        <div
          className="flex justify-between items-center mb-4 border-b pb-4"
          style={{ borderColor: colors.gray200 }}
        >
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/swanSwimLogo.png"
              alt="Swan Swim School"
              className="h-12 w-auto"
            />
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: colors.gray900 }}
              >
                Swan Swim School
              </h1>
              <p
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: colors.blue600 }}
              >
                Progress Report
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="mb-1">
              <span style={{ color: colors.slate500 }}>Term:</span>{" "}
              <span
                className="font-semibold"
                style={{ color: colors.slate900 }}
              >
                {termName || "Current Term"}
              </span>
            </div>
            <div>
              <span style={{ color: colors.slate500 }}>Date:</span>{" "}
              <span
                className="font-semibold"
                style={{ color: colors.slate900 }}
              >
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: colors.slate900 }}
            >
              {studentName}
            </div>
            <div
              className="text-lg font-medium mt-1"
              style={{ color: colors.blue600 }}
            >
              {level.name}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h2
            className="text-sm font-bold uppercase tracking-wider border-b pb-2 mb-2 flex items-center gap-2"
            style={{
              borderColor: colors.slate200,
              color: colors.slate500,
            }}
          >
            <CheckCircle2 className="w-4 h-4" /> Skills Assessment
          </h2>
          <div className="space-y-2">
            {level.skills.map((skill) => {
              const status = skillGrades[skill.id] || "not_started";
              return (
                <div
                  key={skill.id}
                  className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"
                  style={{ borderColor: colors.slate100 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          status === "mastered"
                            ? colors.green500
                            : status === "developing"
                              ? colors.amber400
                              : colors.slate200,
                      }}
                    />
                    <span
                      className="text-sm font-medium leading-relaxed"
                      style={{ color: colors.slate700 }}
                    >
                      {skill.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status === "mastered" && (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                        style={{
                          backgroundColor: colors.green50,
                          color: colors.green700,
                          borderColor: colors.green100,
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                      </span>
                    )}
                    {status === "developing" && (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                        style={{
                          backgroundColor: colors.amber50,
                          color: colors.amber700,
                          borderColor: colors.amber100,
                        }}
                      >
                        <Circle className="w-3.5 h-3.5" /> Developing
                      </span>
                    )}
                    {status === "not_started" && (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide border"
                        style={{
                          backgroundColor: colors.slate50,
                          color: colors.slate400,
                          borderColor: colors.slate100,
                        }}
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> -
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        {comments && (
          <div className="mb-4 grow">
            <h2
              className="text-sm font-bold uppercase tracking-wider border-b pb-2 mb-2"
              style={{
                borderColor: colors.slate200,
                color: colors.slate500,
              }}
            >
              Instructor Comments
            </h2>
            <div
              className="p-6 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderColor: colors.blue100,
                color: colors.slate700,
              }}
            >
              {comments}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-auto pt-4 border-t flex justify-between items-end text-sm"
          style={{
            borderColor: colors.slate200,
            color: colors.slate500,
          }}
        >
          <div>
            <div
              className="font-semibold mb-1 flex items-center gap-2"
              style={{ color: colors.slate900 }}
            >
              <span
                className="p-1 rounded"
                style={{
                  backgroundColor: colors.blue100,
                  color: colors.blue700,
                }}
              >
                <UsersIcon className="w-4 h-4" />
              </span>{" "}
              Instructor: {instructorName || "Swan Swim Staff"}
            </div>
          </div>
          <div className="text-right italic" style={{ color: colors.slate400 }}>
            Keep up the great work!
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
