"use client";

import { useState, useRef } from "react";
import {
  SendEmailRequest,
  SendEmailResponse,
} from "@/lib/api/client/communications";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Paperclip,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  History,
} from "lucide-react";

interface ComposerProps {
  recipientCount: number;
  recipientEmails: string[];
  onSend: (data: SendEmailRequest) => Promise<SendEmailResponse>;
  title?: string;
  onViewRecipients?: () => void;
  recipientLabel?: string;
  onViewHistory?: () => void;
  onRetryFailed?: (failedEmails: string[]) => void;
}

export function Composer({
  recipientCount,
  recipientEmails,
  onSend,
  title = "Compose Email",
  onViewRecipients,
  recipientLabel,
  onViewHistory,
  onRetryFailed,
}: ComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResponse | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!subject || !body || recipientCount === 0) return;

    try {
      setLoading(true);

      const attachments = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          content: await convertFileToBase64(file),
        })),
      );

      const result = await onSend({
        recipients: recipientEmails,
        subject,
        body,
        attachments,
      });

      setSendResult(result);
    } catch (e) {
      console.error(e);
      alert("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNew = () => {
    setSendResult(null);
    setSubject("");
    setBody("");
    setFiles([]);
  };

  const handleRetryFailedRecipients = () => {
    if (!sendResult) return;
    const failedEmails = sendResult.results
      .filter((r) => r.status === "failed")
      .map((r) => r.email);

    if (onRetryFailed) {
      onRetryFailed(failedEmails);
    }
    setSendResult(null);
  };

  // Render Send Status Report
  if (sendResult) {
    const isSuccess = sendResult.status === "sent" || sendResult.status === "delivered";
    const isPartial = sendResult.status === "partial";
    const isFailure = sendResult.status === "failed";

    return (
      <Card className="w-full border shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              {isSuccess && (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              )}
              {isPartial && (
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              )}
              {isFailure && (
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <XCircle className="h-6 w-6" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">
                  {isSuccess
                    ? `Emails Sent Successfully (${sendResult.total})`
                    : isPartial
                      ? `Partially Sent: ${sendResult.successCount} of ${sendResult.total} Succeeded`
                      : `Email Sending Failed (${sendResult.failureCount} Failed)`}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Subject: &quot;{subject}&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sendResult.mock && (
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
                  Mock Mode (No Resend API Key)
                </Badge>
              )}
              <Badge
                variant={isSuccess ? "default" : isPartial ? "secondary" : "destructive"}
                className="capitalize"
              >
                {sendResult.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Recipient Delivery Breakdown ({sendResult.results.length})
            </h4>
            <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
              {sendResult.results.map((r, i) => (
                <div
                  key={i}
                  className="p-3 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-medium text-slate-800 truncate font-mono">
                      {r.email}
                    </div>
                    {r.error ? (
                      <div className="text-xs text-red-600 truncate">
                        Error: {r.error}
                      </div>
                    ) : r.resendId ? (
                      <div className="text-xs text-slate-400 font-mono truncate">
                        Resend ID: {r.resendId}
                      </div>
                    ) : null}
                  </div>

                  <Badge
                    variant={r.status === "sent" || r.status === "delivered" ? "outline" : "destructive"}
                    className={
                      r.status === "sent" || r.status === "delivered"
                        ? "text-green-700 bg-green-50 border-green-200 capitalize text-xs shrink-0"
                        : "capitalize text-xs shrink-0"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 bg-slate-50/30">
          <div className="flex items-center gap-2">
            {sendResult.failureCount > 0 && onRetryFailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailedRecipients}
                className="gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Failed Recipients ({sendResult.failureCount})
              </Button>
            )}
            {onViewHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewHistory}
                className="gap-1.5 text-slate-600 hover:text-slate-900"
              >
                <History className="h-4 w-4" />
                View in Sent History
              </Button>
            )}
          </div>

          <Button onClick={handleResetForNew} size="sm">
            Compose Another Email
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <span className="text-sm font-medium w-16 text-slate-500">To:</span>
          <div className="flex-1 flex items-center justify-between">
            <Input
              readOnly
              value={recipientLabel || `${recipientCount} recipients`}
              className="border-none shadow-none focus-visible:ring-0 px-0 h-auto font-medium flex-1"
            />
            {onViewRecipients && recipientCount > 0 && !recipientLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewRecipients}
                className="text-xs h-7 px-2 text-slate-500 hover:text-slate-900"
              >
                View List
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-b pb-2">
          <span className="text-sm font-medium w-16 text-slate-500">
            Subject:
          </span>
          <Input
            id="subject"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0 h-auto"
          />
        </div>

        <div className="pt-2">
          <Textarea
            id="body"
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="h-[40vh] border-none shadow-none focus-visible:ring-0 resize-none p-0 text-base"
          />
        </div>

        <div className="border-t pt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAttachClick}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attach Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-xs text-slate-500">
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : "No files attached"}
              </span>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm border"
                  >
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles(files.filter((_, i) => i !== index))
                      }
                      className="text-slate-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || recipientCount === 0 || !subject || !body}
        >
          {loading ? "Sending..." : "Send Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}
