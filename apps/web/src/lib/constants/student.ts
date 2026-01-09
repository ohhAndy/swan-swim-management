export interface Term {
  id: string;
  name: string;
  location?: {
    name: string;
  };
}

export interface Instructor {
  id: string;
  staffUserId: string;
  staffUser: {
    fullName: string;
  };
  instructor?: {
    firstName: string;
    lastName: string;
  };
}

export interface Offering {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  termId: string;
  term: Term;
  instructors: Instructor[];
}

export interface ClassSession {
  id: string;
  date: string;
}

export interface Attendance {
  id: string;
  status: "present" | "absent" | "excused";
  classSessionId: string;
  classSession: ClassSession;
}

export interface Enrollment {
  id: string;
  offeringId: string;
  status: "active" | "dropped" | "waitlisted" | "transferred";
  enrollDate: string;
  classRatio: string;
  offering: Offering;
  attendance: Attendance[];
  invoiceLineItem: InvoiceLineItem;
  transferredFrom?: {
    offering: {
      title: string;
      term: { name: string };
    };
  } | null;
  transferredTo?: {
    offering: {
      title: string;
      term: { name: string };
    };
  } | null;
}

export interface Payment {
  amount: number;
}

export interface InvoiceLineItem {
  invoice: Invoice;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "partial" | "paid" | "void";
  totalAmount: number;
  payments: Payment[];
}

export interface Guardian {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Makeup {
  id: string;
  status: "requested" | "scheduled" | "attended" | "cancelled" | "missed";
  notes: string | null;
  createdAt: string;
  classSession: {
    date: string;
    offering: {
      title: string;
      weekday: number;
      startTime: string;
      endTime: string;
      termId: string;
    };
  };
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  shortCode: string | null;
  birthdate: string | null;
  level: string | null;
  guardianId: string;
  guardian: Guardian;
  enrollments: Enrollment[];
  makeUps: Makeup[];
  createdAt: string;
  updatedAt: string;
}
