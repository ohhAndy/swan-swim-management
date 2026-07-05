import { Test, TestingModule } from "@nestjs/testing";
import { TermsService } from "./terms.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";

describe("TermsService", () => {
  let service: TermsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTermWithSchedule", () => {
    it("should create a term and generate a unique slug", async () => {
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

      // Mock slug uniqueness check
      prismaMock.term.findUnique.mockResolvedValue(null); 

      const mockCreatedTerm = {
        id: "term1",
        name: "Winter 2024",
        slug: "winter-2024",
      };

      prismaMock.term.create.mockResolvedValue(mockCreatedTerm as any);
      prismaMock.classOffering.create.mockResolvedValue({ id: "off1" } as any);
      prismaMock.classSession.createMany.mockResolvedValue({ count: 8 });

      const result = await service.createTermWithSchedule(
        {
          name: "Winter 2024",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-03-31"),
          weeks: 8,
          templates: [
            {
              title: "Mon Class",
              weekday: 1,
              startTime: "16:00",
              duration: 30,
              capacity: 4,
            }
          ]
        },
        mockStaffUser,
        "loc1"
      );

      expect(result).toEqual(mockCreatedTerm.id);
      expect(prismaMock.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "winter-2024",
            name: "Winter 2024"
          }),
        }),
      );
    });
  });
});
