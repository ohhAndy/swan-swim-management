"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PDFViewer } from "@react-pdf/renderer";
import { ReportCardPdf } from "./ReportCardPdf";
import type { Level } from "@/lib/api/client/curriculum";

interface ReportCardPdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  selectedLevel: Level | undefined;
  skillgrades: Record<string, "not_started" | "developing" | "mastered">;
  comments: string;
  termName: string;
}

export function ReportCardPdfPreviewDialog({
  open,
  onOpenChange,
  studentName,
  selectedLevel,
  skillgrades,
  comments,
  termName,
}: ReportCardPdfPreviewDialogProps) {
  if (!selectedLevel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
        <DialogTitle>PDF Preview</DialogTitle>
        <div className="flex-1 w-full h-full min-h-[500px] border rounded overflow-hidden mt-4">
          <PDFViewer width="100%" height="100%" className="border-none">
            <ReportCardPdf
              studentName={studentName}
              level={selectedLevel}
              skillGrades={skillgrades}
              comments={comments}
              termName={termName}
            />
          </PDFViewer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
