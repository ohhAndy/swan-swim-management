export type AttendanceStatus = "present" | "absent" | "excused";
export type TrialStatus = "cancelled" | "scheduled" | "noshow" | "attended" | "converted";

export type AttendanceMark = {
  id: string;
  status: AttendanceStatus;
};

export type RosterRow = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentLevel: string | null;
  studentBirthDate: string | null;
  shortCode: string | null;
  notes: string | null;
  attendance: AttendanceMark | null;
  skippedSessionIds: string[];
};

export type Term = {
    id: string;
    name: string;
};

export type SessionSummary = {
    id: string;
    date: string;
    offeringId: string;
    offeringTitle: string;
    offeringNotes: string | null;
    instructors: InstructorInfo[];
}

export type RosterResponse = {
    session: SessionSummary;
    roster: RosterRow[];
    capacity?: number;
    filled?: number;
    openSeats?: number;
    status?: "scheduled" | "canceled" | "completed";
    makeups: MakeupLite[];
    trials: TrialLite[];
}

export type MakeupLite = { 
  id: string;
  studentId: string;
  studentName: string;
  level: string | null;
  shortCode: string | null;
  status: "requested" | "scheduled" | "attended" | "cancelled" | "missed";
}

export type TrialLite = { 
  id: string;
  childName: string;
  childAge: number;
  parentPhone: string;
  status: TrialStatus;
  notes: string | null;
}

export type SlotPage = {
  meta: {
    weekday: number;
    startTime: string;
    endTime: string;
    term: Term | null;
  };
  days: {
    date: string;
    rosters: RosterResponse[];
  }[];
};

export interface InstructorInfo {
  id: string;
  staffUserId: string;
  staffName: string;
}