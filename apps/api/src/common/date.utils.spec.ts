import {
  BUSINESS_TIMEZONE,
  getTorontoDateString,
  getTorontoStartOfDay,
  getTorontoCalendarDate,
  formatCalendarDate,
  torontoDayRange,
  calendarDateRange,
} from "./date.utils";

describe("date.utils (apps/api)", () => {
  it("should export BUSINESS_TIMEZONE as America/Toronto", () => {
    expect(BUSINESS_TIMEZONE).toBe("America/Toronto");
  });

  describe("getTorontoDateString", () => {
    it("should return the correct Toronto date string at UTC rollover", () => {
      // 8:30 PM EDT on Sept 7 = 00:30 UTC on Sept 8
      const lateEvening = new Date("2026-09-08T00:30:00Z");
      expect(getTorontoDateString(lateEvening)).toBe("2026-09-07");
    });

    it("should format standard morning time in Toronto", () => {
      const morning = new Date("2026-09-07T14:00:00Z"); // 10:00 AM EDT
      expect(getTorontoDateString(morning)).toBe("2026-09-07");
    });
  });

  describe("getTorontoStartOfDay", () => {
    it("should compute midnight Toronto time in summer (EDT, UTC-4)", () => {
      const summer = new Date("2026-07-15T12:00:00Z");
      const start = getTorontoStartOfDay(summer);
      expect(start.toISOString()).toBe("2026-07-15T04:00:00.000Z");
      expect(
        start.toLocaleTimeString("en-US", { timeZone: BUSINESS_TIMEZONE, hour: "numeric", minute: "numeric" }),
      ).toBe("12:00 AM");
    });

    it("should compute midnight Toronto time in winter (EST, UTC-5)", () => {
      const winter = new Date("2026-01-15T12:00:00Z");
      const start = getTorontoStartOfDay(winter);
      expect(start.toISOString()).toBe("2026-01-15T05:00:00.000Z");
      expect(
        start.toLocaleTimeString("en-US", { timeZone: BUSINESS_TIMEZONE, hour: "numeric", minute: "numeric" }),
      ).toBe("12:00 AM");
    });
  });

  describe("formatCalendarDate", () => {
    it("should format calendar date strings identically regardless of time", () => {
      expect(formatCalendarDate("2026-09-15")).toBe("Sep 15, 2026");
      expect(formatCalendarDate("2026-09-15T00:00:00.000Z")).toBe("Sep 15, 2026");
    });
  });

  describe("torontoDayRange", () => {
    it("covers whole Toronto days in winter (EST)", () => {
      expect(torontoDayRange("2026-11-24", "2026-11-24")).toEqual({
        gte: new Date("2026-11-24T05:00:00Z"),
        lt: new Date("2026-11-25T05:00:00Z"),
      });
    });

    it("covers whole Toronto days in summer (EDT)", () => {
      expect(torontoDayRange("2026-07-01", "2026-07-31")).toEqual({
        gte: new Date("2026-07-01T04:00:00Z"),
        lt: new Date("2026-08-01T04:00:00Z"),
      });
    });

    it("supports open-ended ranges", () => {
      expect(torontoDayRange(undefined, "2026-12-31")).toEqual({
        lt: new Date("2027-01-01T05:00:00Z"),
      });
      expect(torontoDayRange()).toBeUndefined();
    });
  });

  describe("calendarDateRange", () => {
    it("includes the whole end date for dates stored at UTC midnight", () => {
      expect(calendarDateRange("2026-11-01", "2026-11-30")).toEqual({
        gte: new Date("2026-11-01T00:00:00Z"),
        lt: new Date("2026-12-01T00:00:00Z"),
      });
    });
  });

  describe("getTorontoCalendarDate", () => {
    // 11:30 PM EDT on Sep 7 is already Sep 8 in UTC
    const lateEvening = new Date("2026-09-08T03:30:00Z");

    it("uses the Toronto calendar day, not the UTC one", () => {
      expect(getTorontoCalendarDate(0, lateEvening).toISOString()).toBe(
        "2026-09-07T00:00:00.000Z",
      );
      expect(getTorontoCalendarDate(1, lateEvening).toISOString()).toBe(
        "2026-09-08T00:00:00.000Z",
      );
    });

    it("rolls over month ends", () => {
      const lastOfMonth = new Date("2026-09-30T16:00:00Z");
      expect(getTorontoCalendarDate(1, lastOfMonth).toISOString()).toBe(
        "2026-10-01T00:00:00.000Z",
      );
    });
  });
});
