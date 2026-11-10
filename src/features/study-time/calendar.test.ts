import { describe, expect, test } from "vitest";
import {
  addWeeks,
  formatDay,
  formatLongDate,
  formatWeekRange,
  isDateKey,
  isFutureDate,
  isFutureWeek,
  resolveWeek,
  startOfWeek,
  toDateKey,
  weekDays,
} from "./calendar";

describe("toDateKey", () => {
  test("uses the local calendar date, not the UTC one", () => {
    // 23:30 local time: in a negative UTC offset, toISOString would already
    // be on the next day.
    expect(toDateKey(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
    expect(toDateKey(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });
});

describe("isDateKey", () => {
  test.each(["2026-11-09", "2024-02-29"])("accepts %s", (key) => {
    expect(isDateKey(key)).toBe(true);
  });

  test.each(["2026-02-30", "2025-02-29", "2026-13-01", "2026-1-9", "x", ""])(
    "rejects %j",
    (key) => {
      expect(isDateKey(key)).toBe(false);
    },
  );
});

describe("startOfWeek", () => {
  test.each([
    ["2026-11-09", "2026-11-09"], // Monday
    ["2026-11-11", "2026-11-09"], // Wednesday
    ["2026-11-15", "2026-11-09"], // Sunday
    ["2026-11-16", "2026-11-16"], // next Monday
  ])("the week of %s starts on %s", (day, monday) => {
    expect(startOfWeek(day)).toBe(monday);
  });

  test("crosses into the previous month and year", () => {
    expect(startOfWeek("2026-03-01")).toBe("2026-02-23");
    expect(startOfWeek("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weekDays", () => {
  test("lists Monday to Sunday across a month change", () => {
    expect(weekDays("2026-11-30")).toEqual([
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
      "2026-12-06",
    ]);
  });

  test("lists Monday to Sunday across a year change", () => {
    const days = weekDays("2025-12-29");
    expect(days[0]).toBe("2025-12-29");
    expect(days[3]).toBe("2026-01-01");
    expect(days[6]).toBe("2026-01-04");
    expect(days.map((day) => formatDay(day).weekday)).toEqual([
      "SEG",
      "TER",
      "QUA",
      "QUI",
      "SEX",
      "SÁB",
      "DOM",
    ]);
  });

  test("handles a leap day", () => {
    expect(weekDays("2028-02-28").slice(0, 3)).toEqual([
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
  });
});

test("moves whole weeks without drifting across daylight saving changes", () => {
  // Brazil and many other regions change clocks in these periods.
  expect(addWeeks("2026-03-02", 6)).toBe("2026-04-13");
  expect(addWeeks("2026-11-09", -2)).toBe("2026-10-26");
  expect(addWeeks("2026-01-05", -1)).toBe("2025-12-29");
});

describe("isFutureWeek", () => {
  test("only weeks after the current one are in the future", () => {
    const today = "2026-11-11";
    expect(isFutureWeek("2026-11-02", today)).toBe(false);
    expect(isFutureWeek("2026-11-09", today)).toBe(false);
    expect(isFutureWeek("2026-11-16", today)).toBe(true);
  });
});

describe("resolveWeek", () => {
  const today = "2026-11-11";

  test("defaults to the current week", () => {
    expect(resolveWeek(null, today)).toBe("2026-11-09");
  });

  test.each(["", "abc", "2026-02-30", "2026-11-9"])(
    "falls back to the current week for %j",
    (param) => {
      expect(resolveWeek(param, today)).toBe("2026-11-09");
    },
  );

  test("uses the week that contains a date that is not a Monday", () => {
    expect(resolveWeek("2026-10-29", today)).toBe("2026-10-26");
  });

  test("never resolves to a future week", () => {
    expect(resolveWeek("2026-11-16", today)).toBe("2026-11-09");
    expect(resolveWeek("2030-01-07", today)).toBe("2026-11-09");
  });
});

describe("labels", () => {
  test("formats a day as weekday and DD/MM", () => {
    expect(formatDay("2026-11-09")).toEqual({ weekday: "SEG", date: "09/11" });
    expect(formatDay("2026-11-14")).toEqual({ weekday: "SÁB", date: "14/11" });
  });

  test("formats a long date for assistive technology", () => {
    expect(formatLongDate("2026-11-09")).toBe("segunda-feira, 09/11/2026");
  });

  test("formats the week range with the year", () => {
    expect(formatWeekRange("2026-11-09")).toBe("09/11 – 15/11/2026");
  });

  test("shows both years when the week crosses into a new year", () => {
    expect(formatWeekRange("2025-12-29")).toBe("29/12/2025 – 04/01/2026");
  });
});

describe("isFutureDate", () => {
  test("only days after today are in the future", () => {
    expect(isFutureDate("2026-11-10", "2026-11-11")).toBe(false);
    expect(isFutureDate("2026-11-11", "2026-11-11")).toBe(false);
    expect(isFutureDate("2026-11-12", "2026-11-11")).toBe(true);
  });

  test("compares across a month change", () => {
    expect(isFutureDate("2026-12-01", "2026-11-30")).toBe(true);
    expect(isFutureDate("2026-11-30", "2026-12-01")).toBe(false);
  });

  test("compares across a year change", () => {
    expect(isFutureDate("2026-01-01", "2025-12-31")).toBe(true);
    expect(isFutureDate("2025-12-31", "2026-01-01")).toBe(false);
  });
});
