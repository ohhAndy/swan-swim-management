import { Test, TestingModule } from "@nestjs/testing";
import { InvoicesService } from "./invoices.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";
import { EnrollmentsService } from "../enrollments/enrollments.service";

describe("InvoicesService", () => {
  let service: InvoicesService;
  let prismaMock: MockPrismaService;
  let auditLogsService: Partial<AuditLogsService>;
  let enrollmentsService: Partial<EnrollmentsService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    auditLogsService = { create: jest.fn() };
    enrollmentsService = { getUnInvoicedEnrollments: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: EnrollmentsService, useValue: enrollmentsService },
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
        enrollmentSkips: [],
      });
      // 8 sessions * 50 = 400
      expect(result).toBe(400);
    });

    it("should calculate correct amount for 2:1 ratio with skips", () => {
      const result = service.calculateEnrollmentAmount({
        classRatio: "2:1",
        offering: { sessions: new Array(10) },
        enrollmentSkips: new Array(2),
      });
      // 10 sessions - 2 skips = 8 billable sessions
      // 8 * 73 = 584
      expect(result).toBe(584);
    });

    it("should default to 3:1 rate if ratio is unknown", () => {
      const result = service.calculateEnrollmentAmount({
        classRatio: "unknown",
        offering: { sessions: new Array(5) },
        enrollmentSkips: [],
      });
      // 5 sessions * 50 = 250
      expect(result).toBe(250);
    });
  });

  describe("getUnInvoicedEnrollments", () => {
    it("should delegate to EnrollmentsService", async () => {
      (enrollmentsService.getUnInvoicedEnrollments as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      const scope = { locationId: "loc1", accessibleIds: null };
      const result = await service.getUnInvoicedEnrollments({}, scope);
      expect(enrollmentsService.getUnInvoicedEnrollments).toHaveBeenCalledWith({}, scope);
      expect(result).toEqual({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });
    });
  });

  describe("invoice location", () => {
    const manager: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "manager@test.com",
      fullName: "Manager",
      role: "manager",
      active: true,
      accessSchedule: {},
      accessibleLocations: [
        { id: "loc_nm", slug: "newmarket" },
        { id: "loc_mk", slug: "markham" },
      ],
    };
    const scope = { locationId: "loc_nm", accessibleIds: ["loc_nm", "loc_mk"] };
    const enrollmentsAt = (...locationIds: string[]) =>
      prismaMock.enrollment.findMany.mockResolvedValue(
        locationIds.map((locationId) => ({
          offering: { term: { locationId } },
        })),
      );
    const line = (enrollmentId?: string) => ({
      enrollmentId,
      description: "Tuition",
      amount: 100,
    });
    const savedLocation = () =>
      prismaMock.invoice.create.mock.calls[0][0].data.locationId;

    beforeEach(() => {
      prismaMock.invoiceLineItem.findMany.mockResolvedValue([]);
      prismaMock.invoice.create.mockResolvedValue({
        id: "inv1",
        status: "partial",
        totalAmount: 100,
        payments: [],
        installments: [],
      });
    });

    it("takes the location of the classes billed, not the current one", async () => {
      enrollmentsAt("loc_mk");
      await service.create(
        { totalAmount: 100, lineItems: [line("e1")] },
        manager,
        scope,
      );
      expect(savedLocation()).toBe("loc_mk");
    });

    it("asks staff to choose when classes span two locations", async () => {
      enrollmentsAt("loc_nm", "loc_mk");
      prismaMock.location.findMany.mockResolvedValue([
        { name: "Markham" },
        { name: "Newmarket" },
      ]);
      await expect(
        service.create(
          { totalAmount: 200, lineItems: [line("e1"), line("e2")] },
          manager,
          scope,
        ),
      ).rejects.toThrow(
        "This invoice bills classes at Markham and Newmarket. Choose which of these locations it belongs to.",
      );
      expect(prismaMock.invoice.create).not.toHaveBeenCalled();
    });

    it("uses the location staff chose among those billed", async () => {
      enrollmentsAt("loc_nm", "loc_mk");
      await service.create(
        {
          totalAmount: 200,
          locationId: "loc_mk",
          lineItems: [line("e1"), line("e2")],
        },
        manager,
        scope,
      );
      expect(savedLocation()).toBe("loc_mk");
    });

    it("refuses a location other than the one the classes are at", async () => {
      enrollmentsAt("loc_mk");
      prismaMock.location.findMany.mockResolvedValue([{ name: "Markham" }]);
      await expect(
        service.create(
          { totalAmount: 100, locationId: "loc_nm", lineItems: [line("e1")] },
          manager,
          scope,
        ),
      ).rejects.toThrow(
        "This invoice bills classes at Markham only, so it belongs to Markham.",
      );
    });

    it("uses the current location for a sale with no classes", async () => {
      await service.create(
        { totalAmount: 100, lineItems: [line()] },
        manager,
        scope,
      );
      expect(savedLocation()).toBe("loc_nm");
      expect(prismaMock.enrollment.findMany).not.toHaveBeenCalled();
    });

    it("refuses to bill classes at a location the user may not access", async () => {
      enrollmentsAt("loc_other");
      await expect(
        service.create(
          { totalAmount: 100, lineItems: [line("e1")] },
          manager,
          scope,
        ),
      ).rejects.toThrow("You do not have access to this location.");
    });
  });

  describe("remove", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1", slug: "loc-1" }],
    };

    it("should successfully remove an invoice and log it", async () => {
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: "inv1",
        status: "partial",
      });
      prismaMock.invoice.delete.mockResolvedValue({ id: "inv1" });

      await service.remove("inv1", mockStaffUser);

      expect(prismaMock.invoice.delete).toHaveBeenCalledWith({
        where: { id: "inv1" },
      });
      expect(auditLogsService.create).toHaveBeenCalled();
    });
  });
});
