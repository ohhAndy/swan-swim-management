import { Test, TestingModule } from "@nestjs/testing";
import { ReportCardsService } from "./report-cards.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { CommunicationsService } from "../communications/communications.service";

describe("ReportCardsService", () => {
  let service: ReportCardsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCardsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CommunicationsService, useValue: { sendReportCardEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReportCardsService>(ReportCardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
