import { Test, TestingModule } from "@nestjs/testing";
import { TrialBookingsService } from "./trial-bookings.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

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
    it("should throw NotFoundException if session does not exist", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.classSession.findUnique.mockResolvedValue(null);

      await expect(
        service.createTrialBooking(
          "sess1", "Child", 5, "1234567890", null, "3:1", { authId: "user1", email: "test@test.com" }
        )
      ).rejects.toThrow(/not found/);
    });

    it("should throw BadRequestException if flexible course", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.classSession.findUnique.mockResolvedValue({ id: "sess1", offering: { type: "flexible" } });

      await expect(
        service.createTrialBooking(
          "sess1", "Child", 5, "1234567890", null, "3:1", { authId: "user1", email: "test@test.com" }
        )
      ).rejects.toThrow(/flexible/);
    });
  });
});
