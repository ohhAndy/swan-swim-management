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
  Save,
  Eye,
  Mail,
} from "lucide-react";
import { getLevels, Level } from "@/lib/api/client/curriculum";
import {
  createReportCard,
  updateReportCard,
  ReportCard,
  getReportCards,
  getReportCard,
  sendEmailReportCard,
} from "@/lib/api/client/report-card";
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
import { ReportCardPdf } from "./ReportCardPdf";
import { ReportCardSkillsGrid } from "./ReportCardSkillsGrid";
import { ReportCardPdfPreviewDialog } from "./ReportCardPdfPreviewDialog";

interface ReportCardFormProps {
  enrollmentId: string;
  studentLevelId?: string;
  studentName: string;
  termName: string;
  onClose?: () => void;
}

export function ReportCardForm({
  enrollmentId,
  studentLevelId,
  studentName,
  termName,
  onClose,
}: ReportCardFormProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [skillgrades, setSkillGrades] = useState<
    Record<string, "not_started" | "developing" | "mastered">
  >({});

  // Form State
  const [existingReportCard, setExistingReportCard] =
    useState<ReportCard | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [status, setStatus] = useState<
    "draft" | "completed" | "did_not_pass" | "sent"
  >("draft");
  const [comments, setComments] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [levelsData, reportCardsData] = await Promise.all([
        getLevels(),
        getReportCards(),
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

  const handleGradeChange = (
    skillId: string,
    grade: "not_started" | "developing" | "mastered",
  ) => {
    setSkillGrades((prev) => ({ ...prev, [skillId]: grade }));
  };

  const handleSave = async () => {
    if (!selectedLevelId) return;
    setSaving(true);

    const data = {
      enrollmentId,
      levelId: selectedLevelId,
      status,
      comments,
      skills: Object.entries(skillgrades).map(([skillId, statusVal]) => ({
        skillId,
        status: statusVal,
      })),
    };

    try {
      if (existingReportCard) {
        await updateReportCard(existingReportCard.id, data);
      } else {
        const newCard = await createReportCard(data);
        setExistingReportCard(newCard);
      }
      toast.success("Report card saved successfully.");
      loadData();
    } catch (error) {
      console.error("Failed to save report card", error);
      toast.error("Failed to save report card.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (status === "completed") {
      setSubmitConfirmOpen(true);
    } else {
      handleSave();
    }
  };

  const handleEmail = async () => {
    if (!existingReportCard) {
      toast.error("Please save the report card first.");
      return;
    }
    if (!selectedLevel) return;

    setSendingEmail(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");

      const blob = await pdf(
        <ReportCardPdf
          studentName={studentName}
          level={selectedLevel}
          skillGrades={skillgrades}
          comments={comments}
          termName={termName}
        />,
      ).toBlob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const pdfBase64 = base64data.split(",")[1];

        await sendEmailReportCard(existingReportCard.id, pdfBase64);
        toast.success("Email sent successfully!");
        const updated = await getReportCard(existingReportCard.id);
        setExistingReportCard(updated);
        setStatus("sent");
      };
    } catch (error) {
      console.error("Failed to send email", error);
      toast.error("Failed to send email.");
    } finally {
      setSendingEmail(false);
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
            <span className="text-xs text-muted-foreground mt-1 space-y-0.5 flex flex-col">
              <span>
                Created by:{" "}
                <strong>
                  {existingReportCard.createdByUser?.fullName || "Unknown"}
                </strong>
              </span>
              <span>
                Last updated:{" "}
                {new Date(existingReportCard.updatedAt).toLocaleString()}
                {existingReportCard.updatedByUser?.fullName && (
                  <>
                    {" "}
                    by{" "}
                    <strong>{existingReportCard.updatedByUser.fullName}</strong>
                  </>
                )}
              </span>
              {existingReportCard.status === "sent" &&
                existingReportCard.sentAt && (
                  <span>
                    Sent: {new Date(existingReportCard.sentAt).toLocaleString()}
                    {existingReportCard.sentByUser?.fullName && (
                      <>
                        {" "}
                        by{" "}
                        <strong>
                          {existingReportCard.sentByUser.fullName}
                        </strong>
                      </>
                    )}
                  </span>
                )}
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
          <ReportCardSkillsGrid
            selectedLevel={selectedLevel}
            skillgrades={skillgrades}
            onGradeChange={handleGradeChange}
            disabled={isReadOnly}
          />
        )}

        <div className="space-y-2">
          <Label>Instructor Comments / Recommendations</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Write general feedback, achievements, or things to work on..."
            rows={4}
            disabled={isReadOnly}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Close
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!selectedLevel}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
          </div>

          <div className="flex gap-2">
            {existingReportCard && existingReportCard.status !== "sent" && (
              <Button
                variant="secondary"
                onClick={handleEmail}
                disabled={sendingEmail || saving}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Email to Guardian
              </Button>
            )}

            {!isReadOnly && (
              <Button onClick={handleSaveClick} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Report Card
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <ReportCardPdfPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        studentName={studentName}
        selectedLevel={selectedLevel}
        skillgrades={skillgrades}
        comments={comments}
        termName={termName}
      />

      <AlertDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Report Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Marking this report card as &quot;Completed&quot; will advance the
              student to the next swim level and lock the report card from
              further edits. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSubmitConfirmOpen(false);
                handleSave();
              }}
            >
              Yes, Complete Report Card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
