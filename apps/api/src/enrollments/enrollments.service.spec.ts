import { Test, TestingModule } from "@nestjs/testing";
import { EnrollmentsService } from "./enrollments.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { RequestStaffUser } from "../auth/auth.types";

describe("EnrollmentsService", () => {
  let service: EnrollmentsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        AuditLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateRemarks", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1" }],
    };

    it("should throw NotFoundException if enrollment does not exist", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.updateRemarks("enr1", { remarks: "test" }, mockStaffUser)).rejects.toThrow(NotFoundException);
    });

    it("should correctly update remarks and create an audit log", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", remarks: "old" } as any);
      
      const mockUpdated = { id: "enr1", remarks: "test" };
      prismaMock.enrollment.update.mockResolvedValue(mockUpdated as any);

      const result = await service.updateRemarks("enr1", { remarks: "test" }, mockStaffUser);
      expect(result).toEqual({ success: true, notes: "test" });
      expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
        where: { id: "enr1" },
        data: { notes: "test" },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("transferEnrollment", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1" }],
    };

    it("should throw BadRequestException if enrollment is not active", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", status: "withdrawn" } as any);

      await expect(service.transferEnrollment("enr1", { targetOfferingId: "off1", skippedSessionIds: [] }, mockStaffUser)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if target offering does not exist", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", status: "active" } as any);
      prismaMock.classOffering.findUnique.mockResolvedValue(null);

      await expect(service.transferEnrollment("enr1", { targetOfferingId: "off1", skippedSessionIds: [] }, mockStaffUser)).rejects.toThrow(NotFoundException);
    });

    it("should successfully transfer enrollment inside a transaction", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: "enr1",
        status: "active",
        studentId: "student1",
        offeringId: "off1",
        classRatio: "3:1",
        offering: { termId: "term1" },
        student: { firstName: "Jane", lastName: "Doe" },
      } as any);

      prismaMock.classOffering.findUnique.mockResolvedValue({
        id: "off2",
        termId: "term1",
      } as any);

      prismaMock.enrollment.findFirst
        .mockResolvedValueOnce(null) // no existing active
        .mockResolvedValueOnce(null); // no existing inactive

      prismaMock.classSession.findMany.mockResolvedValue([]);
      prismaMock.attendance.findMany.mockResolvedValue([]);
      prismaMock.enrollmentSkip.findMany.mockResolvedValue([]);
      prismaMock.enrollment.create.mockResolvedValue({ id: "enr2" } as any);
      prismaMock.enrollment.update.mockResolvedValue({ id: "enr1" } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await service.transferEnrollment(
        "enr1",
        { targetOfferingId: "off2", skippedSessionIds: [] },
        mockStaffUser,
      );

      expect(result.success).toBe(true);
      expect(result.oldEnrollmentId).toBe("enr1");
      expect(result.newEnrollmentId).toBe("enr2");
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe("bulkTransfer", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1" }],
    };

    it("should return succeeded: 0 for empty transfer list", async () => {
      const result = await service.bulkTransfer([], mockStaffUser);
      expect(result).toEqual({ succeeded: 0, results: [] });
    });

    it("should process multiple transfers in a single atomic transaction", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: "enr1",
        status: "active",
        studentId: "student1",
        offeringId: "off1",
        classRatio: "3:1",
        offering: { termId: "term1" },
        student: { firstName: "Jane", lastName: "Doe" },
      } as any);

      prismaMock.classOffering.findUnique.mockResolvedValue({
        id: "off2",
        termId: "term1",
      } as any);

      prismaMock.enrollment.findFirst.mockResolvedValue(null);
      prismaMock.classSession.findMany.mockResolvedValue([]);
      prismaMock.attendance.findMany.mockResolvedValue([]);
      prismaMock.enrollmentSkip.findMany.mockResolvedValue([]);
      prismaMock.enrollment.create.mockResolvedValue({ id: "enr-new" } as any);
      prismaMock.enrollment.update.mockResolvedValue({ id: "enr1" } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await service.bulkTransfer(
        [
          { enrollmentId: "enr1", targetOfferingId: "off2" },
        ],
        mockStaffUser,
      );

      expect(result.succeeded).toBe(1);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it("should fail the entire batch if one transfer errors out", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue(null); // Will throw NotFoundException

      await expect(
        service.bulkTransfer(
          [{ enrollmentId: "enr-invalid", targetOfferingId: "off2" }],
          mockStaffUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getUnInvoicedEnrollments", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1" }],
    };

    it("should allow admins to see all locations by default even when locationId is passed", async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);
      prismaMock.enrollment.count.mockResolvedValue(0);

      await service.getUnInvoicedEnrollments(
        { guardianId: "g1" },
        mockStaffUser,
        "loc1",
      );

      // Where clause should NOT filter by locationId since admin sees all locations by default
      expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceLineItem: null,
            student: { guardianId: "g1" },
          }),
        }),
      );
      const findManyCall = (prismaMock.enrollment.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.offering).toBeUndefined();
    });

    it("should restrict managers to their validated location", async () => {
      const mockManagerUser: RequestStaffUser = {
        id: "staff2",
        authId: "user2",
        email: "manager@test.com",
        fullName: "Test Manager",
        role: "manager",
        active: true,
        accessSchedule: {},
        accessibleLocations: [{ id: "loc1" }],
      };

      prismaMock.enrollment.findMany.mockResolvedValue([]);
      prismaMock.enrollment.count.mockResolvedValue(0);

      await service.getUnInvoicedEnrollments(
        { guardianId: "g1" },
        mockManagerUser,
        "loc1",
      );

      expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            offering: { term: { locationId: "loc1" } },
          }),
        }),
      );
    });
  });
});
