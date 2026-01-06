export type Row = {
  id: string;
  name: string;
  paymentStatus: string | null;
  balance: number | null;
  invoiceNumber: string | null;
  classRatio: string;
  studentId: string;
  code: string | null;
  level: string | null;
  marks: Record<string, string>;
  skippedSessionIds: string[];
  enrollmentId: string;
  birthdate: string | null;
  remarks: string | null;
};
