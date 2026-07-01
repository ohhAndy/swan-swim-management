"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  Circle,
  HelpCircle,
  Save,
  Eye,
  Mail,
} from "lucide-react";

import { getLevels, Level } from "@/lib/api/curriculum-client";
import { StaffRole } from "@/lib/auth/permissions";
import {
  createReportCard,
  updateReportCard,
  ReportCard,
  getReportCards,
  sendEmailReportCard,
} from "@/lib/api/report-card-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportCardPdf } from "./ReportCardPdf";
import dynamic from "next/dynamic";
import { PermissionGate } from "@/components/auth/PermissionGate";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    ),
  },
);

interface ReportCardFormProps {
  enrollmentId: string;
  studentLevelId?: string;
  studentName: string;
  termName: string;
  instructorName: string;
  userRole?: StaffRole;
  onClose?: () => void;
}

export function ReportCardForm({
  enrollmentId,
  studentLevelId,
  studentName,
  termName,
  instructorName,
  userRole,
  onClose,
}: ReportCardFormProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [skillgrades, setSkillGrades] = useState<
    Record<string, "not_started" | "developing" | "mastered">
  >({});

  /* const componentRef = useRef<HTMLDivElement>(null); */
  /* Replaced with direct PDF generation */

  // Form State
  const [existingReportCard, setExistingReportCard] =
    useState<ReportCard | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [status, setStatus] = useState<
    "draft" | "completed" | "did_not_pass" | "sent"
  >("draft");
  const [comments, setComments] = useState("");

  const handleEmail = async () => {
    if (!existingReportCard) {
      toast.error("Please save the report card first.");
      return;
    }
    if (!selectedLevel) return;

    setSendingEmail(true);
    try {
      // Generate PDF Blob using @react-pdf/renderer
      const { pdf } = await import("@react-pdf/renderer");

      const blob = await pdf(
        <ReportCardPdf
          studentName={studentName}
          level={selectedLevel}
          skillGrades={skillgrades}
          comments={comments}
          termName={termName}
          instructorName={instructorName}
        />,
      ).toBlob();

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const pdfBase64 = base64data.split(",")[1];

        await sendEmailReportCard(existingReportCard.id, pdfBase64);
        toast.success("Email sent successfully!");
        setStatus("sent");
      };
    } catch (error) {
      console.error("Failed to send email", error);
      toast.error("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [levelsData, reportCardsData] = await Promise.all([
        getLevels(),
        getReportCards(), // Optimally this would filter by enrollmentId on the backend
      ]);

      setLevels(levelsData);

      // Find existing report card for this enrollment
      const existing = reportCardsData.find(
        (rc) => rc.enrollmentId === enrollmentId,
      );

      if (existing) {
        setExistingReportCard(existing);
        setSelectedLevelId(existing.levelId || "");
        setStatus(existing.status);
        setComments(existing.comments || "");

        // Map existing skills
        const grades: Record<
          string,
          "not_started" | "developing" | "mastered"
        > = {};
        existing.reportCardSkills.forEach((rcSkill) => {
          grades[rcSkill.skillId] = rcSkill.status;
        });
        setSkillGrades(grades);
      } else {
        // Default to student's current level or first level
        if (studentLevelId && levelsData.some((l) => l.id === studentLevelId)) {
          setSelectedLevelId(studentLevelId);
        } else if (levelsData.length > 0) {
          setSelectedLevelId(levelsData[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load report card data", error);
      toast.error("Failed to load report card data.");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, studentLevelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedLevel = levels.find((l) => l.id === selectedLevelId);
  const studentLevel = levels.find((l) => l.id === studentLevelId);
  const isReadOnly =
    existingReportCard?.status === "completed" ||
    existingReportCard?.status === "sent";

  const groupedLevels = levels.reduce(
    (acc, lvl) => {
      const category = lvl.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(lvl);
      return acc;
    },
    {} as Record<string, Level[]>,
  );

  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const handleGradeChange = (
    skillId: string,
    grade: "not_started" | "developing" | "mastered",
  ) => {
    setSkillGrades((prev) => ({ ...prev, [skillId]: grade }));
  };

  const handleSaveClick = () => {
    if (status === "completed") {
      setSubmitConfirmOpen(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!selectedLevelId) return;
    setSaving(true);

    const data = {
      enrollmentId,
      levelId: selectedLevelId,
      status,
      comments,
      skills: Object.entries(skillgrades).map(([skillId, status]) => ({
        skillId,
        status,
      })),
    };

    try {
      if (existingReportCard) {
        await updateReportCard(existingReportCard.id, data);
      } else {
        const newCard = await createReportCard(data);
        setExistingReportCard(newCard); // Set it so we can email immediately after save
      }
      toast.success("Report card saved successfully.");
      // if (onClose) onClose();
      // Optionally reload data here
      loadData();
    } catch (error) {
      console.error("Failed to save report card", error);
      toast.error("Failed to save report card.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Report Card: {studentName}</CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <span>Grade skills and provide feedback for this term.</span>
          {existingReportCard && (
            <span className="text-xs text-muted-foreground mt-1">
              Created by:{" "}
              <strong>
                {existingReportCard.createdByUser?.fullName || "Unknown"}
              </strong>{" "}
              • Last updated:{" "}
              {new Date(existingReportCard.updatedAt).toLocaleString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm flex items-start gap-3">
            <span className="text-base shrink-0 mt-0.5">ℹ️</span>
            <div>
              This report card has been completed/sent and is now read-only.
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={selectedLevelId}
              onValueChange={(val) => {
                setSelectedLevelId(val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {Object.entries(groupedLevels).map(([category, catLevels]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground">
                      {category}
                    </SelectLabel>
                    {catLevels.map((l) => {
                      let suffix = "";
                      if (studentLevel) {
                        if (l.id === studentLevel.id) {
                          suffix = " (Active Level)";
                        } else if (l.order < studentLevel.order) {
                          suffix = " (Completed / Prior Level)";
                        }
                      }
                      return (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                          {suffix}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {selectedLevel &&
              studentLevel &&
              selectedLevel.order < studentLevel.order && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm mt-2 flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
                  <div>
                    This is a completed/prior level. Completing it will not
                    upgrade the student&apos;s active level ({studentLevel.name}
                    ).
                  </div>
                </div>
              )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(
                val: "draft" | "completed" | "did_not_pass" | "sent",
              ) => setStatus(val)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="did_not_pass">Did Not Pass</SelectItem>
                {status === "sent" && (
                  <SelectItem value="sent">Sent</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedLevel && (
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
                      {[
                        {
                          val: "not_started",
                          icon: HelpCircle,
                          label: "Not Started",
                          color: "text-red-500",
                          bg: "bg-red-100 dark:bg-red-900/30",
                        },
                        {
                          val: "developing",
                          icon: Circle,
                          label: "Developing",
                          color: "text-yellow-500",
                          bg: "bg-yellow-100 dark:bg-yellow-900/30",
                        },
                        {
                          val: "mastered",
                          icon: CheckCircle2,
                          label: "Mastered",
                          color: "text-green-600",
                          bg: "bg-green-100 dark:bg-green-900/30",
                        },
                      ].map((option) => (
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
                          onClick={() =>
                            handleGradeChange(
                              skill.id,
                              option.val as
                                | "not_started"
                                | "developing"
                                | "mastered",
                            )
                          }
                          disabled={isReadOnly}
                          title={option.label}
                        >
                          <option.icon
                            className={cn(
                              "h-5 w-5",
                              skillgrades[skill.id] === option.val
                                ? option.color
                                : "text-muted-foreground",
                            )}
                          />
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Comments</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Additional feedback for the student..."
            className="min-h-[100px]"
            disabled={isReadOnly}
          />
        </div>

        {status === "completed" && !isReadOnly && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              Saving as <strong>Completed</strong> will automatically upgrade
              the student to the next level.
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <PermissionGate
            allowedRoles={["super_admin"]}
            currentRole={userRole || "supervisor"}
          >
            <Button
              variant="secondary"
              onClick={() => setShowPreview(true)}
              disabled={!selectedLevel}
            >
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
          </PermissionGate>

          <div className="flex gap-3 ml-auto">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSaveClick} disabled={saving || isReadOnly}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />{" "}
              {status === "completed"
                ? "Submit & Complete"
                : "Save Report Card"}
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[800px] w-full h-[90vh] flex flex-col p-6">
          <DialogTitle className="sr-only">Report Card Preview</DialogTitle>
          {selectedLevel && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 w-full h-full">
              <div className="flex justify-start gap-2 print:hidden shrink-0">
                <Button
                  onClick={handleEmail}
                  variant="outline"
                  disabled={sendingEmail || !existingReportCard || status === "sent"}
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {status === "sent" ? "Email Sent" : "Email Guardians"}
                </Button>
              </div>

              <div
                className="border rounded-md overflow-hidden w-full"
                style={{ height: "calc(90vh - 120px)" }}
              >
                <PDFViewer
                  width="100%"
                  height="100%"
                  className="w-full h-full border-none"
                >
                  <ReportCardPdf
                    studentName={studentName}
                    level={selectedLevel}
                    skillGrades={skillgrades}
                    comments={comments}
                    termName={termName}
                    instructorName={instructorName}
                  />
                </PDFViewer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit & Complete Report Card?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  Are you sure you want to mark this report card as{" "}
                  <strong>Completed</strong>?
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-xs flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <strong>Once submitted, this action is final:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-900 font-normal">
                      <li>
                        The report card will become read-only and cannot be
                        changed.
                      </li>
                      <li>
                        The student will be automatically upgraded to the next
                        level.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSubmitConfirmOpen(false);
                handleSave();
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
