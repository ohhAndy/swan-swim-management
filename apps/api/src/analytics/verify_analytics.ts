import { AnalyticsService } from "./analytics.service";

// Mock PrismaService
const mockPrismaService = {
  payment: {
    findMany: async () => [],
  },
  location: {
    findMany: async () => [],
  },
  invoice: {
    groupBy: async () => [],
  },
  invoiceLineItem: {
    findMany: async () => [],
  },
} as any;

async function verify() {
  console.log("Starting Verification...");
  const service = new AnalyticsService(mockPrismaService);

  // --- Test 1: getRevenueByLocation ---
  console.log("Test 1: getRevenueByLocation");
  mockPrismaService.payment.findMany = async () => [
    { amount: "100", invoice: { locationId: "loc1" } },
    { amount: "50", invoice: { locationId: "loc1" } },
    { amount: "200", invoice: { locationId: "loc2" } },
    { amount: "75", invoice: { locationId: null } },
  ];
  mockPrismaService.location.findMany = async () => [
    { id: "loc1", name: "Location 1" },
    { id: "loc2", name: "Location 2" },
  ];

  const locResult = await service.getRevenueByLocation();

  if (locResult.find((r) => r.locationId === "loc1")?.revenue !== 150)
    throw new Error("Loc1 revenue incorrect");
  if (locResult.find((r) => r.locationId === "loc2")?.revenue !== 200)
    throw new Error("Loc2 revenue incorrect");
  if (locResult.find((r) => r.locationId === null)?.revenue !== 75)
    throw new Error("Unknown location revenue incorrect");
  console.log("✅ getRevenueByLocation passed");

  // --- Test 2: getRevenueByTerm (Proportional Attribution) ---
  console.log("Test 2: getRevenueByTerm");
  const mockPayment = {
    amount: "50",
    invoice: {
      totalAmount: "100",
      location: { name: "Test Loc" },
      lineItems: [
        {
          amount: "60",
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
          amount: "40",
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

  mockPrismaService.payment.findMany = async () => [mockPayment];

  const termResult = await service.getRevenueByTerm();

  const termA = termResult.find((r) => r.termName.includes("Term A")); // "Term A (LA)"
  const termB = termResult.find((r) => r.termName.includes("Term B")); // "Term B (LB)"

  if (termA?.revenue !== 30)
    throw new Error(
      `Term A revenue incorrect. Expected 30, got ${termA?.revenue}`,
    );
  if (termB?.revenue !== 20)
    throw new Error(
      `Term B revenue incorrect. Expected 20, got ${termB?.revenue}`,
    );

  console.log("✅ getRevenueByTerm passed");
  console.log("All tests passed!");
}

verify().catch((e) => {
  console.error("Verification Failed:", e);
  process.exit(1);
});
