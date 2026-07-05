import { Test, TestingModule } from "@nestjs/testing";
import { OfferingsService } from "./offerings.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException } from "@nestjs/common";
import { RequestStaffUser } from "../auth/auth.types";

describe("OfferingsService", () => {
  let service: OfferingsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OfferingsService>(OfferingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateOfferingInfo", () => {
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

    it("should throw NotFoundException if offering does not exist", async () => {
      prismaMock.classOffering.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOfferingInfo("off1", { title: "New Title" }, mockStaffUser)
      ).rejects.toThrow(NotFoundException);
    });

    it("should correctly update offering title", async () => {
      prismaMock.classOffering.findUnique.mockResolvedValue({ id: "off1", title: "Old Title" } as any);
      
      const mockUpdated = { id: "off1", title: "New Title" };
      prismaMock.classOffering.update.mockResolvedValue(mockUpdated as any);

      const result = await service.updateOfferingInfo("off1", { title: "New Title" }, mockStaffUser);
      expect(result).toEqual({ success: true });
      expect(prismaMock.classOffering.update).toHaveBeenCalledWith({
        where: { id: "off1" },
        data: { title: "New Title" }
      });
    });
  });
});
