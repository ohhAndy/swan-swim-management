import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    payment: {
      findMany: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRevenueByLocation", () => {
    it("should correctly aggregate revenue by location from payments", async () => {
      // Mock data
      const mockPayments = [
        {
          amount: 100,
          invoice: { locationId: "loc1" },
        },
        {
          amount: 50,
          invoice: { locationId: "loc1" },
        },
        {
          amount: 200,
          invoice: { locationId: "loc2" },
        },
        {
          amount: 75,
          invoice: { locationId: null }, // Handle missing location
        },
      ];

      const mockLocations = [
        { id: "loc1", name: "Location 1" },
        { id: "loc2", name: "Location 2" },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.getRevenueByLocation();

      expect(result).toHaveLength(3); // loc1, loc2, Unknown

      // Verify specific results
      const loc1 = result.find((r) => r.locationId === "loc1");
      expect(loc1?.revenue).toBe(150);
      expect(loc1?.locationName).toBe("Location 1");

      const loc2 = result.find((r) => r.locationId === "loc2");
      expect(loc2?.revenue).toBe(200);

      const unknown = result.find((r) => r.locationId === null);
      expect(unknown?.revenue).toBe(75);
      expect(unknown?.locationName).toBe("Unknown Location");
    });
  });

  describe("getRevenueByTerm", () => {
    it("should proportionally attribute partial payments to terms", async () => {
      // Scenario:
      // Invoice Total: 100
      // Line Item 1: 60 (Term A)
      // Line Item 2: 40 (Term B)
      // Payment: 50
      // Expected: Term A = 30, Term B = 20

      const mockPayment = {
        amount: 50,
        invoice: {
          totalAmount: 100,
          location: { name: "Test Loc" },
          lineItems: [
            {
              amount: 60,
              enrollment: {
                offering: {
                  term: {
                    id: "termA",
                    name: "Term A",
                    location: { name: "Loc A" },
                  },
                },
              },
            },
            {
              amount: 40,
              enrollment: {
                offering: {
                  term: {
                    id: "termB",
                    name: "Term B",
                    location: { name: "Loc B" },
                  },
                },
              },
            },
          ],
        },
      };

      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await service.getRevenueByTerm();

      // "Loc A" -> Abbrev "LA", "Loc B" -> Abbrev "LB"
      // Term A (LA): 30
      // Term B (LB): 20

      const termA = result.find((r) => r.termName.includes("Term A"));
      const termB = result.find((r) => r.termName.includes("Term B"));

      expect(termA).toBeDefined();
      expect(termA?.revenue).toBe(30);

      expect(termB).toBeDefined();

      expect(termB?.revenue).toBe(20);
    });

    it("should handle full payments correctly", async () => {
      const mockPayment = {
        amount: 100,
        invoice: {
          totalAmount: 100,
          location: { name: "Test Loc" },
          lineItems: [
            {
              amount: 100,
              enrollment: {
                offering: {
                  term: {
                    id: "termA",
                    name: "Term A",
                    location: { name: "Loc A" },
                  },
                },
              },
            },
          ],
        },
      };

      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await service.getRevenueByTerm();
      const termA = result.find((r) => r.termName.includes("Term A"));

      expect(termA?.revenue).toBe(100);
    });

    it("should handle invoices with 0 total amount (avoid division by zero)", async () => {
      const mockPayment = {
        amount: 0,
        invoice: {
          totalAmount: 0,
          location: { name: "Test Loc" },
          lineItems: [],
        },
      };

      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await service.getRevenueByTerm();
      expect(result).toEqual([]);
    });
  });

  describe("getTermFinancialDetails", () => {
    it("should aggregate revenue by weekday", async () => {
      // Monday, Jan 1, 2024
      const mondayDate = new Date("2024-01-01T12:00:00Z");
      // Wednesday, Jan 3, 2024
      const wednesdayDate = new Date("2024-01-03T12:00:00Z");

      const mockPayments = [
        {
          amount: 100,
          paymentDate: mondayDate,
          invoice: {
            totalAmount: 100,
            lineItems: [
              {
                amount: 100,
                enrollment: {
                  offering: {
                    title: "Program A",
                    termId: "term1",
                  },
                },
              },
            ],
          },
        },
        {
          amount: 50,
          paymentDate: wednesdayDate,
          invoice: {
            totalAmount: 50,
            lineItems: [
              {
                amount: 50,
                enrollment: {
                  offering: {
                    title: "Program A",
                    termId: "term1",
                  },
                },
              },
            ],
          },
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getTermFinancialDetails("term1");

      const monday = result.revenueByWeekday.find((d) => d.day === "Monday");
      const wednesday = result.revenueByWeekday.find(
        (d) => d.day === "Wednesday",
      );
      const tuesday = result.revenueByWeekday.find((d) => d.day === "Tuesday");

      expect(monday?.revenue).toBe(100);
      expect(wednesday?.revenue).toBe(50);
      expect(tuesday?.revenue).toBe(0);
      expect(result.totalRevenue).toBe(150);
    });
  });
});
