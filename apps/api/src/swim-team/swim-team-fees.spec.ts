import {
  buildInstallmentPlan,
  calculateInstallmentStanding,
  calculateSwimTeamFees,
  countSeasonMonths,
} from "@school/shared-types";

describe("swim team fee helpers", () => {
  const tier = { practiceFee: 1800, meetFee: 100 };
  const seasonStart = "2026-09-01";
  const seasonEnd = "2027-06-30";

  describe("countSeasonMonths", () => {
    it("counts calendar months inclusively", () => {
      expect(countSeasonMonths(seasonStart, seasonEnd)).toBe(10);
      expect(countSeasonMonths("2026-09-15", "2026-09-20")).toBe(1);
    });
  });

  describe("calculateSwimTeamFees", () => {
    it("charges the full season when joining at the start", () => {
      expect(
        calculateSwimTeamFees(tier, true, seasonStart, seasonEnd, "2026-09-10"),
      ).toMatchObject({ practiceFee: 1800, meetFee: 100, monthsRemaining: 10 });
    });

    it("charges the full season when registering before it starts", () => {
      expect(
        calculateSwimTeamFees(tier, false, seasonStart, seasonEnd, "2026-07-01")
          .practiceFee,
      ).toBe(1800);
    });

    it("prorates the practice fee by months remaining", () => {
      expect(
        calculateSwimTeamFees(tier, true, seasonStart, seasonEnd, "2027-02-15"),
      ).toMatchObject({ practiceFee: 900, meetFee: 100, monthsRemaining: 5 });
    });

    it("never prorates the meet fee, and skips it for non-competitors", () => {
      expect(
        calculateSwimTeamFees(tier, false, seasonStart, seasonEnd, "2027-02-15")
          .meetFee,
      ).toBe(0);
    });
  });

  describe("buildInstallmentPlan", () => {
    it("splits evenly and puts the cent remainder on the last installment", () => {
      const plan = buildInstallmentPlan(1000, 3, "2026-10-01");
      expect(plan.map((p) => p.amount)).toEqual([333.33, 333.33, 333.34]);
      expect(plan.map((p) => p.dueDate)).toEqual([
        "2026-10-01",
        "2026-11-01",
        "2026-12-01",
      ]);
    });

    it("clamps month-end due dates and rolls over the year", () => {
      expect(
        buildInstallmentPlan(300, 3, "2026-12-31").map((p) => p.dueDate),
      ).toEqual(["2026-12-31", "2027-01-31", "2027-02-28"]);
    });
  });

  describe("calculateInstallmentStanding", () => {
    const plan = buildInstallmentPlan(1000, 4, "2026-10-01");

    it("is behind when less than the installments due so far is paid", () => {
      expect(
        calculateInstallmentStanding(plan, 250, "2026-11-10", 1000),
      ).toMatchObject({
        dueToDate: 500,
        behindAmount: 250,
        isBehind: true,
        nextDueDate: "2026-12-01",
      });
    });

    it("is on track once the due installments are covered", () => {
      expect(
        calculateInstallmentStanding(plan, 500, "2026-11-10", 1000),
      ).toMatchObject({ behindAmount: 0, isBehind: false });
    });

    it("treats an installment as due on its due date", () => {
      expect(
        calculateInstallmentStanding(plan, 0, "2026-10-01", 1000).behindAmount,
      ).toBe(250);
      expect(
        calculateInstallmentStanding(plan, 0, "2026-09-30", 1000).behindAmount,
      ).toBe(0);
    });

    it("skips ahead to the next unpaid installment when paid early", () => {
      expect(
        calculateInstallmentStanding(plan, 750, "2026-10-05", 1000),
      ).toMatchObject({ isBehind: false, nextDueDate: "2027-01-01" });
    });

    it("treats an invoice with no plan as due in full", () => {
      expect(
        calculateInstallmentStanding([], 400, "2026-11-10", 1000),
      ).toMatchObject({ dueToDate: 1000, behindAmount: 600, isBehind: true });
    });
  });
});
