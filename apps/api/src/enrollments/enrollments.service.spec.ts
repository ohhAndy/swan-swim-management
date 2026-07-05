import { Test, TestingModule } from "@nestjs/testing";
import { EnrollmentsService } from "./enrollments.service";
import { PrismaService } from "../prisma/prisma.service";
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
  });
});
