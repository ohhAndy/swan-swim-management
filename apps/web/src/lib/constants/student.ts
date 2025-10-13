export interface Term {
  id: string;
  name: string;
}

export interface Instructor {
  id: string;
  staffUserId: string;
  staffUser: {
    fullName: string;
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
  instructors: Instructor[]
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
  offering: Offering;
  attendance: Attendance[];
}

export interface Guardian {
  id: string;
  fullName: string;
  email: string;
  phone: string;
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
  createdAt: string;
  updatedAt: string;
}
