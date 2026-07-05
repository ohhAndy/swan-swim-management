import { Test, TestingModule } from "@nestjs/testing";
import { TrialBookingsService } from "./trial-bookings.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";

describe("TrialBookingsService", () => {
  let service: TrialBookingsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialBookingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TrialBookingsService>(TrialBookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTrialBooking", () => {
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

    it("should throw NotFoundException if session does not exist", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue(null);

      await expect(
        service.createTrialBooking(
          "sess1", "Child", 5, "1234567890", null, "3:1", mockStaffUser
        )
      ).rejects.toThrow(/not found/);
    });

    it("should throw BadRequestException if flexible course", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue({ id: "sess1", offering: { type: "flexible" } } as any);

      await expect(
        service.createTrialBooking(
          "sess1", "Child", 5, "1234567890", null, "3:1", mockStaffUser
        )
      ).rejects.toThrow(/flexible/);
    });
  });
});
