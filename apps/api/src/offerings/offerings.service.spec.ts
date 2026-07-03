import { Test, TestingModule } from "@nestjs/testing";
import { OfferingsService } from "./offerings.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";

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
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should throw NotFoundException if offering does not exist", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.classOffering.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOfferingInfo("off1", { title: "New Title" }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });

    it("should correctly update offering title", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.classOffering.findUnique.mockResolvedValue({ id: "off1", title: "Old Title" });
      
      const mockUpdated = { id: "off1", title: "New Title" };
      prismaMock.classOffering.update.mockResolvedValue(mockUpdated);

      const result = await service.updateOfferingInfo("off1", { title: "New Title" }, mockUser);
      expect(result).toEqual({ success: true });
      expect(prismaMock.classOffering.update).toHaveBeenCalledWith({
        where: { id: "off1" },
        data: { title: "New Title" }
      });
    });
  });
});
