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
  SelectItem,
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
import {
  createReportCard,
  updateReportCard,
  ReportCard,
  getReportCards,
  sendEmailReportCard,
} from "@/lib/api/report-card-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportCardPdf } from "./ReportCardPdf";
import dynamic from "next/dynamic";

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
  studentName: string;
  termName: string;
  instructorName: string;
  onClose?: () => void;
}

export function ReportCardForm({
  enrollmentId,
  studentName,
  termName,
  instructorName,
  onClose,
}: ReportCardFormProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Form State
  const [existingReportCard, setExistingReportCard] =
    useState<ReportCard | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "completed" | "sent">("draft");
  const [comments, setComments] = useState("");
  const [skillgrades, setSkillGrades] = useState<
    Record<string, "not_started" | "developing" | "mastered">
  >({});
  const [showPreview, setShowPreview] = useState(false);

  /* const componentRef = useRef<HTMLDivElement>(null); */
  /* Replaced with direct PDF generation */

  const handleEmail = async () => {
    if (!existingReportCard) {
      toast.error("Please save the report card first.");
      return;
    }
    if (!selectedLevel) return;

    setSendingEmail(true);
    try {
      // Generate PDF Blob using @react-pdf/renderer
      // We need to dynamically import the pdf function to avoid SSR issues if any
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
      } else if (levelsData.length > 0) {
        // Default to first level
        setSelectedLevelId(levelsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load report card data", error);
      toast.error("Failed to load report card data.");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedLevel = levels.find((l) => l.id === selectedLevelId);

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
        <CardDescription>
          Grade skills and provide feedback for this term.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={selectedLevelId}
              onValueChange={(val) => {
                setSelectedLevelId(val);
                // Reset grades when level changes? Or keep implicit?
                // For now, keep state but they won't show in UI if not in level
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(val: "draft" | "completed" | "sent") =>
                setStatus(val)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
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
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="secondary"
            onClick={() => setShowPreview(true)}
            disabled={!selectedLevel}
          >
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>

          <div className="flex gap-3">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Report Card
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[1000px] w-full h-[90vh] flex flex-col p-6">
          <DialogTitle className="sr-only">Report Card Preview</DialogTitle>
          {selectedLevel && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-end gap-2 print:hidden shrink-0">
                <Button
                  onClick={handleEmail}
                  variant="outline"
                  disabled={sendingEmail || !existingReportCard}
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Email Guardians
                </Button>
              </div>

              <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
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
    </Card>
  );
}
