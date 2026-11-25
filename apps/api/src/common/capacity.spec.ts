import {
  calculateClassUsage,
  calculateSessionUsage,
  getEffectiveCapacity,
  getRatioWeight,
  CLASS_RATIO_WEIGHTS,
  type SessionUsageInput,
} from "./capacity";

describe("Capacity and Ratio Logic", () => {
  describe("CLASS_RATIO_WEIGHTS", () => {
    it("should define correct standard ratios", () => {
      expect(CLASS_RATIO_WEIGHTS["1:1"]).toBe(3.0);
      expect(CLASS_RATIO_WEIGHTS["2:1"]).toBe(1.5);
      expect(CLASS_RATIO_WEIGHTS["3:1"]).toBe(1.0);
    });
  });

  describe("getRatioWeight", () => {
    it("should return 3.0 for 1:1 ratio", () => {
      expect(getRatioWeight("1:1")).toBe(3.0);
    });

    it("should return 1.5 for 2:1 ratio", () => {
      expect(getRatioWeight("2:1")).toBe(1.5);
    });

    it("should return 1.0 for 3:1 ratio", () => {
      expect(getRatioWeight("3:1")).toBe(1.0);
    });

    it("should return 1.0 default for null, undefined or unknown ratio", () => {
      expect(getRatioWeight(null)).toBe(1.0);
      expect(getRatioWeight(undefined)).toBe(1.0);
      expect(getRatioWeight("4:1")).toBe(1.0);
      expect(getRatioWeight("")).toBe(1.0);
    });
  });

  describe("calculateClassUsage", () => {
    it("should calculate filled seats with standard 3:1 enrollments", () => {
      const enrollments = [
        { classRatio: "3:1" },
        { classRatio: "3:1" },
      ];
      const result = calculateClassUsage(enrollments, 1, 3);

      expect(result.filled).toBe(2);
      expect(result.effectiveCapacity).toBe(3);
      expect(result.openSeats).toBe(1);
    });

    it("should correctly weight mixed ratios (1:1 and 2:1)", () => {
      const enrollments = [
        { classRatio: "1:1" }, // 3.0
        { classRatio: "2:1" }, // 1.5
      ];
      const result = calculateClassUsage(enrollments, 1, 6);

      expect(result.filled).toBe(4.5);
      expect(result.effectiveCapacity).toBe(6);
      expect(result.openSeats).toBe(1); // Math.floor(6 - 4.5) = 1
    });

    it("should apply dynamic minimum capacity of 5 when 2 or more instructors are assigned", () => {
      const enrollments = [{ classRatio: "3:1" }];
      // Base capacity is 3, but 2 instructors -> min capacity 5
      const result = calculateClassUsage(enrollments, 2, 3);

      expect(result.effectiveCapacity).toBe(5);
      expect(result.filled).toBe(1);
      expect(result.openSeats).toBe(4);
    });

    it("should respect base capacity if base capacity is higher than dynamic min with 2 instructors", () => {
      const enrollments = [{ classRatio: "3:1" }];
      // Base capacity 6 > dynamic min 5
      const result = calculateClassUsage(enrollments, 2, 6);

      expect(result.effectiveCapacity).toBe(6);
      expect(result.openSeats).toBe(5);
    });

    it("should never return negative open seats when class is full or over-enrolled", () => {
      const enrollments = [
        { classRatio: "1:1" }, // 3.0
        { classRatio: "1:1" }, // 3.0
      ];
      const result = calculateClassUsage(enrollments, 1, 4);

      expect(result.filled).toBe(6);
      expect(result.effectiveCapacity).toBe(4);
      expect(result.openSeats).toBe(0); // Math.max(0, floor(4 - 6)) = 0
    });
  });

  describe("getEffectiveCapacity", () => {
    it("keeps the base capacity with one instructor", () => {
      expect(getEffectiveCapacity(3, 1, "regular")).toBe(3);
      expect(getEffectiveCapacity(6, 1, "regular")).toBe(6);
    });

    it("raises lessons with 2+ instructors to at least 5", () => {
      expect(getEffectiveCapacity(3, 2, "regular")).toBe(5);
      expect(getEffectiveCapacity(3, 2, "flexible")).toBe(5);
      expect(getEffectiveCapacity(7, 2, "regular")).toBe(7);
    });

    it("never raises practices", () => {
      expect(getEffectiveCapacity(3, 2, "swim_team")).toBe(3);
    });
  });

  describe("calculateSessionUsage", () => {
    const base: SessionUsageInput = {
      baseCapacity: 3,
      instructorCount: 1,
      offeringType: "regular",
      enrollments: [],
      makeups: [],
      trials: [],
    };
    const regular = { status: "active" as const, classRatio: "3:1" };

    it("counts regulars, makeups and trials together", () => {
      const result = calculateSessionUsage({
        ...base,
        enrollments: [regular, regular],
        trials: [{ status: "scheduled", classRatio: "3:1" }],
      });
      expect(result).toEqual({ filled: 3, effectiveCapacity: 3, openSeats: 0 });
    });

    it("weights makeups and trials by their own ratio", () => {
      const result = calculateSessionUsage({
        ...base,
        enrollments: [regular],
        makeups: [{ status: "scheduled", classRatio: "1:1" }],
      });
      expect(result.filled).toBe(4);
      expect(result.openSeats).toBe(0);
    });

    it("frees seats for skipped, excused and absent regulars", () => {
      const result = calculateSessionUsage({
        ...base,
        enrollments: [
          { ...regular, skipped: true },
          { ...regular, attendanceStatus: "excused" },
          { ...regular, attendanceStatus: "absent" },
          { ...regular, attendanceStatus: "present" },
        ],
      });
      expect(result.filled).toBe(1);
    });

    it("ignores enrollments that are not active", () => {
      const result = calculateSessionUsage({
        ...base,
        enrollments: [
          { status: "inactive", classRatio: "3:1" },
          { status: "transferred", classRatio: "3:1" },
        ],
      });
      expect(result.filled).toBe(0);
    });

    it("counts only scheduled and attended makeups", () => {
      const result = calculateSessionUsage({
        ...base,
        makeups: (
          ["requested", "scheduled", "attended", "cancelled", "missed"] as const
        ).map((status) => ({ status, classRatio: "3:1" })),
      });
      expect(result.filled).toBe(2);
    });

    it("counts every trial except cancelled ones", () => {
      const result = calculateSessionUsage({
        ...base,
        trials: (
          ["scheduled", "attended", "noshow", "converted", "cancelled"] as const
        ).map((status) => ({ status, classRatio: "3:1" })),
      });
      expect(result.filled).toBe(4);
    });

    it("reports over-capacity sessions with no open seats", () => {
      const result = calculateSessionUsage({
        ...base,
        enrollments: [regular, regular, regular],
        trials: [{ status: "scheduled", classRatio: "2:1" }],
      });
      expect(result.filled).toBe(4.5);
      expect(result.openSeats).toBe(0);
    });
  });
});
