import { Test, TestingModule } from "@nestjs/testing";
import { InvoicesService } from "./invoices.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuthenticatedUser } from "../auth/auth.types";

describe("InvoicesService", () => {
  let service: InvoicesService;
  let prismaMock: MockPrismaService;
  let auditLogsService: Partial<AuditLogsService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    auditLogsService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("calculateEnrollmentAmount", () => {
    it("should calculate correct amount for 3:1 ratio with no skips", () => {
      const result = service.calculateEnrollmentAmount({
        classRatio: "3:1",
        offering: { sessions: new Array(8) },
        enrollmentSkips: []
      });
      // 8 sessions * 50 = 400
      expect(result).toBe(400);
    });

    it("should calculate correct amount for 2:1 ratio with skips", () => {
      const result = service.calculateEnrollmentAmount({
        classRatio: "2:1",
        offering: { sessions: new Array(10) },
        enrollmentSkips: new Array(2)
      });
      // 10 sessions - 2 skips = 8 billable sessions
      // 8 * 73 = 584
      expect(result).toBe(584);
    });

    it("should default to 3:1 rate if ratio is unknown", () => {
      const result = service.calculateEnrollmentAmount({
        classRatio: "unknown",
        offering: { sessions: new Array(5) },
        enrollmentSkips: []
      });
      // 5 sessions * 50 = 250
      expect(result).toBe(250);
    });
  });

  describe("remove", () => {
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should successfully remove an invoice and log it", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: "inv1",
        status: "partial"
      });
      prismaMock.invoice.delete.mockResolvedValue({ id: "inv1" });

      await service.remove("inv1", mockUser);

      expect(prismaMock.invoice.delete).toHaveBeenCalledWith({
        where: { id: "inv1" }
      });
      expect(auditLogsService.create).toHaveBeenCalled();
    });
  });
});
