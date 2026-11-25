import { overCapacityWarning } from "./session-usage";

describe("overCapacityWarning", () => {
  it("is null when the session fits", () => {
    expect(overCapacityWarning(null)).toBeNull();
    expect(
      overCapacityWarning({ filled: 3, effectiveCapacity: 3, openSeats: 0 }),
    ).toBeNull();
  });

  it("describes an over-capacity session", () => {
    expect(
      overCapacityWarning({ filled: 4.5, effectiveCapacity: 3, openSeats: 0 }),
    ).toBe("This class is now over capacity (4.5/3 seats).");
  });
});
