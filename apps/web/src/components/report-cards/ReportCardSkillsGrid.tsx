"use client";

import { CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Level } from "@/lib/api/client/curriculum";

interface ReportCardSkillsGridProps {
  selectedLevel: Level;
  skillgrades: Record<string, "not_started" | "developing" | "mastered">;
  onGradeChange: (
    skillId: string,
    grade: "not_started" | "developing" | "mastered",
  ) => void;
  disabled?: boolean;
}

const GRADE_OPTIONS = [
  {
    val: "not_started" as const,
    icon: HelpCircle,
    label: "Not Started",
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  {
    val: "developing" as const,
    icon: Circle,
    label: "Developing",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    val: "mastered" as const,
    icon: CheckCircle2,
    label: "Mastered",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
];

export function ReportCardSkillsGrid({
  selectedLevel,
  skillgrades,
  onGradeChange,
  disabled,
}: ReportCardSkillsGridProps) {
  return (
    <div className="border rounded-md p-4 bg-muted/5 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedLevel.color || "#3b82f6" }}
        />
        {selectedLevel.name} Skills
      </h3>

      <div className="space-y-3">
        {selectedLevel.skills.length === 0 ? (
          <p className="text-muted-foreground italic">
            No skills defined for this level.
          </p>
        ) : (
          selectedLevel.skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-3 bg-background rounded border"
            >
              <span className="font-medium text-sm">
                {skill.description}
              </span>
              <div className="flex gap-1">
                {GRADE_OPTIONS.map((option) => (
                  <Button
                    key={option.val}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "px-2 h-8 transition-all hover:opacity-80",
                      skillgrades[skill.id] === option.val
                        ? `${option.bg} shadow-sm ring-1 ring-primary/10`
                        : "hover:bg-muted opacity-50 hover:opacity-100",
                    )}
                    onClick={() => onGradeChange(skill.id, option.val)}
                    disabled={disabled}
                    title={option.label}
                  >
                    <option.icon
                      className={cn(
                        "h-4 w-4 mr-1",
                        option.color,
                        skillgrades[skill.id] === option.val && "scale-110",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold hidden sm:inline",
                        option.color,
                      )}
                    >
                      {option.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
