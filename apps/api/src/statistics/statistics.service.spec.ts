import { Test, TestingModule } from "@nestjs/testing";
import { StatisticsService } from "./statistics.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

describe("StatisticsService", () => {
  let service: StatisticsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should throw error if termId is missing", async () => {
      await expect(
        service.getDashboardStats("", { authId: "user1", email: "test@test.com" })
      ).rejects.toThrow(/Term ID is required/);
    });

    it("should throw error if user not found", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue(null);
      await expect(
        service.getDashboardStats("term1", { authId: "user1", email: "test@test.com" })
      ).rejects.toThrow(/User not found/);
    });
  });
});
