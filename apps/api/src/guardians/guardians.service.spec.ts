import { Test, TestingModule } from "@nestjs/testing";
import { GuardiansService } from "./guardians.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

describe("GuardiansService", () => {
  let service: GuardiansService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardiansService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GuardiansService>(GuardiansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
