import {
  calculateClassUsage,
  getRatioWeight,
  CLASS_RATIO_WEIGHTS,
} from "./capacity.utils";

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
});
