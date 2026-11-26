import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { LocationScopeGuard } from "./location-scope.guard";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { PrismaService } from "../prisma/prisma.service";
import { RequestStaffUser } from "./auth.types";
import {
  fromBody,
  fromBodyList,
  fromParam,
  LocationScope,
  ScopeCheck,
} from "./location-scope";

const staff = (
  role: string,
  locations: { id: string; slug: string }[] = [],
): RequestStaffUser => ({
  id: "staff1",
  authId: "auth1",
  email: "staff@test.com",
  fullName: "Staff",
  role,
  active: true,
  accessSchedule: null,
  accessibleLocations: locations,
});

const NEWMARKET = { id: "loc_nm", slug: "newmarket" };
const MARKHAM = { id: "loc_mk", slug: "markham" };

interface FakeRequest {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, unknown>;
  body?: unknown;
  staffUser?: RequestStaffUser;
  locationScope?: LocationScope;
}

describe("LocationScopeGuard", () => {
  let prisma: MockPrismaService;
  let checks: ScopeCheck[] | undefined;
  let guard: LocationScopeGuard;

  const run = async (request: FakeRequest) => {
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
    await guard.canActivate(context);
    return request.locationScope;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    checks = undefined;
    const reflector = {
      getAllAndOverride: () => checks,
    } as unknown as Reflector;
    guard = new LocationScopeGuard(reflector, prisma as unknown as PrismaService);
  });

  describe("resolving the header", () => {
    it("leaves public routes without a scope", async () => {
      expect(await run({ headers: {} })).toBeUndefined();
    });

    it("covers every accessible location when no header is sent", async () => {
      const scope = await run({
        headers: {},
        staffUser: staff("manager", [NEWMARKET, MARKHAM]),
      });
      expect(scope).toEqual({
        locationId: null,
        accessibleIds: ["loc_nm", "loc_mk"],
      });
    });

    it("treats 'all' like no header", async () => {
      const scope = await run({
        headers: { "x-location-id": "all" },
        staffUser: staff("admin"),
      });
      expect(scope).toEqual({ locationId: null, accessibleIds: null });
    });

    it("accepts a manager's location by id or slug", async () => {
      const user = staff("manager", [NEWMARKET, MARKHAM]);
      expect(
        await run({ headers: { "x-location-id": "loc_mk" }, staffUser: user }),
      ).toEqual({ locationId: "loc_mk", accessibleIds: ["loc_nm", "loc_mk"] });
      expect(
        await run({ headers: { "x-location-id": "markham" }, staffUser: user }),
      ).toEqual({ locationId: "loc_mk", accessibleIds: ["loc_nm", "loc_mk"] });
    });

    it("refuses a location the manager may not access", async () => {
      await expect(
        run({
          headers: { "x-location-id": "loc_mk" },
          staffUser: staff("manager", [NEWMARKET]),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("looks up any location for an admin, by id or slug", async () => {
      prisma.location.findFirst.mockResolvedValue({ id: "loc_mk" });
      const scope = await run({
        headers: { "x-location-id": "markham" },
        staffUser: staff("admin"),
      });
      expect(scope).toEqual({ locationId: "loc_mk", accessibleIds: null });
      expect(prisma.location.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: "markham" }, { slug: "markham" }] },
        select: { id: true },
      });
    });

    it("rejects an unknown location for an admin", async () => {
      prisma.location.findFirst.mockResolvedValue(null);
      await expect(
        run({ headers: { "x-location-id": "nowhere" }, staffUser: staff("admin") }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("@ScopedTo checks", () => {
    it("allows a record at an accessible location", async () => {
      checks = [fromParam("invoice", "id")];
      prisma.invoice.findMany.mockResolvedValue([{ locationId: "loc_nm" }]);
      await expect(
        run({
          headers: {},
          params: { id: "inv1" },
          staffUser: staff("manager", [NEWMARKET]),
        }),
      ).resolves.toBeDefined();
    });

    it("refuses a record at another location", async () => {
      checks = [fromParam("invoice", "id")];
      prisma.invoice.findMany.mockResolvedValue([{ locationId: "loc_mk" }]);
      await expect(
        run({
          headers: {},
          params: { id: "inv1" },
          staffUser: staff("manager", [NEWMARKET]),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("checks a record's location through its term", async () => {
      checks = [fromBody("session", "classSessionId")];
      prisma.classSession.findMany.mockResolvedValue([
        { offering: { term: { locationId: "loc_mk" } } },
      ]);
      await expect(
        run({
          headers: {},
          body: { classSessionId: "s1" },
          staffUser: staff("supervisor", [NEWMARKET]),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("checks every id in a body list", async () => {
      checks = [fromBodyList("enrollment", "transfers", "enrollmentId")];
      prisma.enrollment.findMany.mockResolvedValue([
        { offering: { term: { locationId: "loc_nm" } } },
        { offering: { term: { locationId: "loc_mk" } } },
      ]);
      await expect(
        run({
          headers: {},
          body: { transfers: [{ enrollmentId: "e1" }, { enrollmentId: "e2" }] },
          staffUser: staff("manager", [NEWMARKET]),
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ["e1", "e2"] } } }),
      );
    });

    it("leaves a missing id to the handler", async () => {
      checks = [fromParam("invoice", "id")];
      await run({ headers: {}, params: {}, staffUser: staff("manager", [NEWMARKET]) });
      expect(prisma.invoice.findMany).not.toHaveBeenCalled();
    });

    it("skips the lookup for admins", async () => {
      checks = [fromParam("invoice", "id")];
      await run({ headers: {}, params: { id: "inv1" }, staffUser: staff("admin") });
      expect(prisma.invoice.findMany).not.toHaveBeenCalled();
    });
  });
});
