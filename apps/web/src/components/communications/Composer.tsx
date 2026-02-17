"use client";

import { useState, useRef } from "react";
import { SendEmailRequest } from "@/lib/api/communications-client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Paperclip, X } from "lucide-react";

interface ComposerProps {
  recipientCount: number;
  recipientEmails: string[];
  onSend: (data: SendEmailRequest) => Promise<unknown>;
  title?: string;
  onViewRecipients?: () => void;
}

export function Composer({
  recipientCount,
  recipientEmails,
  onSend,
  title = "Compose Email",
  onViewRecipients,
  recipientLabel,
}: ComposerProps & { recipientLabel?: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
  // ...
  <Button
    variant="outline"
    size="sm"
    type="button"
    onClick={handleAttachClick}
    className="gap-2"
  >
    <Paperclip className="h-4 w-4" />
    Attach Files
  </Button>;

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Remove data URL prefix (e.g. "data:image/png;base64,")
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

      await onSend({
        recipients: recipientEmails,
        subject,
        body,
        attachments,
      });
      setSent(true);
      setSubject("");
      setBody("");
      setFiles([]);
    } catch (e) {
      console.error(e);
      alert("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-green-600">
          <p className="text-xl font-semibold">Email Queued Successfully!</p>
          <p>Sent to {recipientCount} recipients.</p>
          <Button
            variant="outline"
            onClick={() => setSent(false)}
            className="mt-4"
          >
            Send Another
          </Button>
        </CardContent>
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
