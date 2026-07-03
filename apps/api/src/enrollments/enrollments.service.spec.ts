import { Test, TestingModule } from "@nestjs/testing";
import { EnrollmentsService } from "./enrollments.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";

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
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should throw NotFoundException if enrollment does not exist", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      await expect(service.updateRemarks("enr1", { remarks: "test" }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it("should correctly update remarks and create an audit log", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", remarks: "old" });
      
      const mockUpdated = { id: "enr1", remarks: "test" };
      prismaMock.enrollment.update.mockResolvedValue(mockUpdated);

      const result = await service.updateRemarks("enr1", { remarks: "test" }, mockUser);
      expect(result).toEqual({ success: true, notes: "test" });
      expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
        where: { id: "enr1" },
        data: { notes: "test" },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("transferEnrollment", () => {
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should throw BadRequestException if enrollment is not active", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", status: "withdrawn" });

      await expect(service.transferEnrollment("enr1", { targetOfferingId: "off1", skippedSessionIds: [] }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if target offering does not exist", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: "enr1", status: "active" });
      prismaMock.classOffering.findUnique.mockResolvedValue(null);

      await expect(service.transferEnrollment("enr1", { targetOfferingId: "off1", skippedSessionIds: [] }, mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
