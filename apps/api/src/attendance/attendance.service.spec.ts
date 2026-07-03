import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceService } from "./attendance.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { AttendanceStatus } from "@prisma/client";
import { AuthenticatedUser } from "../auth/auth.types";

describe("AttendanceService", () => {
  let service: AttendanceService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("upsert", () => {
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should successfully upsert an attendance record", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.attendance.findUnique.mockResolvedValue(null);
      
      const mockUpserted = {
        enrollmentId: "enr1",
        sessionId: "sess1",
        status: AttendanceStatus.present,
      };

      prismaMock.attendance.upsert.mockResolvedValue(mockUpserted);

      const result = await service.upsert({
        enrollmentId: "enr1",
        classSessionId: "sess1",
        status: AttendanceStatus.present
      }, mockUser);

      expect(result).toBeDefined();
      expect(prismaMock.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            status: AttendanceStatus.present
          })
        })
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should delete attendance record if status is empty string", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.attendance.findUnique.mockResolvedValue({
        enrollmentId: "enr1",
        sessionId: "sess1",
        status: AttendanceStatus.absent
      });

      // Pass "" as status to trigger deletion logic
      const result = await service.upsert({
        enrollmentId: "enr1",
        classSessionId: "sess1",
        status: "" as AttendanceStatus
      }, mockUser);

      expect(result).toEqual({ success: true });
      expect(prismaMock.attendance.delete).toHaveBeenCalledWith({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: "enr1",
            classSessionId: "sess1",
          }
        }
      });
    });
  });
});
