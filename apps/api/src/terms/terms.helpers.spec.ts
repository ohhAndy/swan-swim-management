import { weeklyDates } from "./terms.helpers";

describe("weeklyDates", () => {
  const start = new Date("2026-09-01T00:00:00.000Z"); // a Tuesday
  const end = new Date("2026-09-30T00:00:00.000Z");
  const keys = (dates: Date[]) => dates.map((d) => d.toISOString().slice(0, 10));

  it("yields every matching weekday through the end date", () => {
    expect(keys([...weeklyDates(start, end, 1)])).toEqual([
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
    ]);
  });

  it("includes the start date when it falls on the weekday", () => {
    expect(keys([...weeklyDates(start, end, 2)])[0]).toBe("2026-09-01");
  });

  it.each([undefined, null, -1, 7, 1.5])(
    "throws instead of looping forever for weekday %p",
    (weekday) => {
      expect(() => [...weeklyDates(start, end, weekday)]).toThrow(RangeError);
    },
  );
});
