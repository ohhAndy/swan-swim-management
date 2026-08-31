export interface AttendanceData {
  id: string;
  classSessionId?: string;
  enrollmentId?: string;
  status: string;
  notes?: string | null;
  markedAt: string;
  classSession: {
    id: string;
    date: string;
  };
}

export interface OfferingData {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  termId: string;
  term: {
    id: string;
    name: string;
  };
  instructors: Array<{
    staffUser: {
      fullName: string;
    };
    instructor?: {
      firstName: string;
      lastName: string;
    };
  }>;
  sessions: Array<{ id: string; date: string }>;
}

export interface EnrollmentData {
  id: string;
  status: string;
  enrollDate: string;
  classRatio: string;
  offering: OfferingData;
  invoiceLineItem?: {
    invoice: {
      id: string;
      status: string;
      totalAmount: number;
      payments: Array<{
        amount: number;
      }>;
    };
  };
  attendance: AttendanceData[];
  enrollmentSkips: Array<{ classSessionId: string }>;
}

export interface GuardianStudentData {
  id: string;
  firstName: string;
  lastName: string;
  shortCode?: string | null;
  birthdate?: string | null;
  level?: string | null;
  enrollments: Array<EnrollmentData>;
}

export interface GuardianData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  notes?: string | null;
  waiverSigned: boolean;
  students: Array<GuardianStudentData>;
}
