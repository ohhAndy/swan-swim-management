import { Test, TestingModule } from "@nestjs/testing";
import { StudentsService } from "./students.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException } from "@nestjs/common";
import { StaffUserWithLocations } from "../auth/auth.types";

describe("StudentsService", () => {
  let service: StudentsService;
  let prismaMock: MockPrismaService;

  const mockAuditLogsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getById", () => {
    it("should throw NotFoundException if student does not exist", async () => {
      prismaMock.student.findUnique.mockResolvedValue(null);
      await expect(service.getById("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return student without filtering enrollments if user is not a supervisor", async () => {
      const mockStudent = {
        id: "student-1",
        enrollments: [
          {
            id: "e1",
            status: "withdrawn",
            offering: { term: { endDate: new Date("2020-01-01") } },
          },
          {
            id: "e2",
            status: "active",
            offering: { term: { endDate: new Date("2020-01-01") } },
          },
        ],
      } as unknown as Awaited<ReturnType<typeof service.getById>>;

      // Need to mock deactivateExpiredEnrollments since getById calls it
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.student.findUnique.mockResolvedValue(mockStudent);

      const staffUser: StaffUserWithLocations = {
        id: "admin-id",
        authId: "admin-auth",
        email: "admin@test.com",
        fullName: "Admin User",
        role: "admin",
        active: true,
        accessSchedule: {},
        accessibleLocations: [],
      };

      const result = await service.getById("student-1", staffUser);

      expect(result.enrollments).toHaveLength(2); // No filtering applied
    });

    it("should filter enrollments correctly if user is a supervisor", async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockStudent = {
        id: "student-1",
        enrollments: [
          // Active & Future End Date -> Should be kept (Active)
          {
            id: "e1",
            status: "active",
            offering: { term: { endDate: futureDate } },
            reportCards: [],
          },

          // Active & Past End Date -> Not active, but kept as 1st past enrollment
          {
            id: "e2",
            status: "active",
            offering: { term: { endDate: pastDate } },
            reportCards: [],
          },

          // Active & Past End Date -> Not active, and already kept 1 past enrollment, so removed
          {
            id: "e3",
            status: "active",
            offering: { term: { endDate: pastDate } },
            reportCards: [],
          },

          // Not active, but has report card by me -> Should be kept
          {
            id: "e4",
            status: "inactive",
            offering: { term: { endDate: pastDate } },
            reportCards: [{ createdBy: "super-id" }],
          },
        ],
      } as unknown as Awaited<ReturnType<typeof service.getById>>;

      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.student.findUnique.mockResolvedValue(mockStudent);

      const staffUser: StaffUserWithLocations = {
        id: "super-id",
        authId: "super-auth",
        email: "super@test.com",
        fullName: "Supervisor User",
        role: "supervisor",
        active: true,
        accessSchedule: {},
        accessibleLocations: [],
      };

      const result = await service.getById("student-1", staffUser);

      expect(result.enrollments).toHaveLength(3);
      expect(result.enrollments.map((e) => e.id)).toEqual(["e1", "e2", "e4"]);
    });
  });
});
