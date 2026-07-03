import { Test, TestingModule } from "@nestjs/testing";
import { MakeupsService } from "./makeups.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { BadRequestException } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";

// Mock countUsedSeatsForSession so we don't have to stub deeply
jest.mock("../sessions/sessions.helpers", () => ({
  countUsedSeatsForSession: jest.fn().mockResolvedValue({ filled: 1, effectiveCapacity: 4 }),
}));

// Mock validateLocationAccess
jest.mock("../common/helpers/location-access.helper", () => ({
  validateLocationAccess: jest.fn(),
}));

describe("MakeupsService", () => {
  let service: MakeupsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeupsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MakeupsService>(MakeupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("scheduleMakeUp", () => {
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };
    const mockDto = {
      studentId: "student1",
      classSessionId: "target1",
      notes: "Test makeup"
    };

    it("should throw BadRequestException if session not found", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.classSession.findUnique.mockResolvedValue(null);

      await expect(service.scheduleMakeUp(mockDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it("should correctly create a makeup booking and log it", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1", accessibleLocations: [{ id: "loc1" }] });
      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "target1",
        offering: { term: { locationId: "loc1" } }
      });
      prismaMock.makeUpBooking.findUnique.mockResolvedValue(null); // No duplicate
      
      const mockBooking = { 
        id: "bk1", 
        status: "scheduled",
        student: { firstName: "John", lastName: "Doe", birthdate: "2010-01-01", level: "Beginner" },
        classSession: { date: new Date("2024-01-01") }
      };
      prismaMock.makeUpBooking.create.mockResolvedValue(mockBooking);

      const result = await service.scheduleMakeUp(mockDto, mockUser);
      
      expect(result).toEqual({ makeUpId: "bk1", status: "scheduled" });
      expect(prismaMock.makeUpBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: "student1",
            classSessionId: "target1"
          })
        })
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });
});
