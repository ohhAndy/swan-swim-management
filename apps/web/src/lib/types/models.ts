import { Prisma } from "@prisma/client";

export type Serialize<T> = T extends Date
  ? string
  : T extends Prisma.Decimal
  ? number
  : T extends Array<infer U>
  ? Array<Serialize<U>>
  : T extends object
  ? { [K in keyof T]: Serialize<T[K]> }
  : T;

export type Level = Serialize<Prisma.LevelGetPayload<{
  include: { skills: true };
}>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Skill = Serialize<Prisma.SkillGetPayload<{}>>;

export type Task = Serialize<Prisma.TaskGetPayload<{
  include: {
    assignedTo: { select: { id: true; fullName: true } };
    createdBy: { select: { id: true; fullName: true } };
  };
}>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type InventoryItem = Serialize<Prisma.InventoryItemGetPayload<{}>>;

export type Term = Serialize<Prisma.TermGetPayload<{
  include: {
    location: { select: { name: true } };
  };
}>>;

export type Instructor = Serialize<Prisma.ClassInstructorGetPayload<{
  include: {
    staffUser: { select: { fullName: true } };
    instructor: { select: { firstName: true; lastName: true } };
  };
}>>;

export type Offering = Serialize<Prisma.ClassOfferingGetPayload<{
  include: {
    term: { include: { location: { select: { name: true } } } };
    instructors: {
      include: {
        staffUser: { select: { fullName: true } };
        instructor: { select: { firstName: true; lastName: true } };
      };
    };
    sessions: { select: { id: true; date: true } };
  };
}>>;

export type ClassSession = Serialize<Prisma.ClassSessionGetPayload<{
  select: { id: true; date: true };
}>>;

export type Attendance = Serialize<Prisma.AttendanceGetPayload<{
  include: {
    classSession: { select: { id: true; date: true } };
  };
}>>;

export type EnrollmentSkip = Serialize<Prisma.EnrollmentSkipGetPayload<{
  include: {
    classSession: { select: { id: true; date: true } };
  };
}>>;

export type Payment = Serialize<Prisma.PaymentGetPayload<{
  select: { amount: true };
}>>;

export type Invoice = Serialize<Prisma.InvoiceGetPayload<{
  include: {
    payments: true;
    guardian: true;
    location: { select: { id: true; name: true } };
    lineItems: {
      include: {
        enrollment: {
          include: {
            offering: {
              include: { term: { include: { location: { select: { name: true } } } } }
            }
          }
        }
      }
    };
  };
}>> & {
  amountPaid: number;
  balance: number;
  calculatedStatus: "paid" | "partial" | "void";
};

export type InvoiceLineItem = Serialize<Prisma.InvoiceLineItemGetPayload<{
  include: {
    invoice: {
      include: {
        payments: true;
      };
    };
    enrollment: {
      include: {
        offering: {
          include: { term: { include: { location: { select: { name: true } } } } }
        }
      }
    };
  };
}>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Guardian = Serialize<Prisma.GuardianGetPayload<{}>>;

export type Makeup = Serialize<Prisma.MakeUpBookingGetPayload<{
  include: {
    classSession: {
      include: {
        offering: {
          select: { title: true; weekday: true; startTime: true; endTime: true; termId: true };
        };
      };
    };
  };
}>>;

// Base Enrollment payload
const _enrollmentInclude = {
  offering: {
    include: {
      term: { include: { location: { select: { name: true } } } },
      instructors: {
        include: {
          staffUser: { select: { fullName: true } },
          instructor: { select: { firstName: true, lastName: true } },
        },
      },
      sessions: { select: { id: true, date: true } },
    },
  },
  attendance: { include: { classSession: { select: { id: true, date: true } } } },
  enrollmentSkips: { include: { classSession: { select: { id: true, date: true } } } },
  invoiceLineItem: {
    include: {
      invoice: { include: { payments: { select: { amount: true } } } },
    },
  },
  transferredFrom: { include: { offering: { select: { title: true, term: { select: { name: true } } } } } },
  transferredTo: { include: { offering: { select: { title: true, term: { select: { name: true } } } } } },
  reportCards: {
    include: {
      createdByUser: { select: { fullName: true } },
      level: { select: { name: true } },
    },
  },
} satisfies Prisma.EnrollmentInclude;

export type Enrollment = Serialize<Prisma.EnrollmentGetPayload<{
  include: typeof _enrollmentInclude;
}>>;

export type Student = Serialize<Prisma.StudentGetPayload<{
  include: {
    guardian: true;
    enrollments: {
      include: typeof _enrollmentInclude;
    };
    makeUps: {
      include: {
        classSession: {
          include: {
            offering: {
              select: { title: true; weekday: true; startTime: true; endTime: true; termId: true };
            };
          };
        };
      };
    };
  };
}>>;

export type AuditLog = Serialize<Prisma.AuditLogGetPayload<{
  include: {
    staff: { select: { fullName: true; email: true; role: true } };
  };
}>>;

export type ReportCardSkill = Serialize<Prisma.ReportCardSkillGetPayload<{
  include: {
    skill: true;
  };
}>>;

export type ReportCard = Serialize<Prisma.ReportCardGetPayload<{
  include: {
    createdByUser: { select: { fullName: true } };
    updatedByUser: { select: { fullName: true } };
    sentByUser: { select: { fullName: true } };
    level: true;
    reportCardSkills: {
      include: { skill: true };
    };
  };
}>>;
