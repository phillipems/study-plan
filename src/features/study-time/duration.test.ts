import { expect, test } from "vitest";
import {
  MAX_DAILY_MINUTES,
  formatDuration,
  parseDuration,
  splitDuration,
} from "./duration";

test("converts hours and minutes to a total in minutes", () => {
  expect(parseDuration({ hours: "1", minutes: "30" })).toEqual({
    ok: true,
    minutes: 90,
  });
  expect(parseDuration({ hours: "02", minutes: "15" })).toEqual({
    ok: true,
    minutes: 135,
  });
  expect(parseDuration({ hours: " 0 ", minutes: "5" })).toEqual({
    ok: true,
    minutes: 5,
  });
});

test("accepts the daily maximum of 23:59", () => {
  expect(parseDuration({ hours: "23", minutes: "59" })).toEqual({
    ok: true,
    minutes: MAX_DAILY_MINUTES,
  });
});

test("rejects empty fields", () => {
  expect(parseDuration({ hours: "", minutes: " " })).toEqual({
    ok: false,
    errors: { hours: "required", minutes: "required" },
  });
});

test.each(["-1", "1.5", "1,5", "1e2", "uma", "+1"])(
  "rejects %j as hours",
  (hours) => {
    expect(parseDuration({ hours, minutes: "00" })).toEqual({
      ok: false,
      errors: { hours: "invalid" },
    });
  },
);

test("rejects minutes from 60 on", () => {
  expect(parseDuration({ hours: "1", minutes: "60" })).toEqual({
    ok: false,
    errors: { minutes: "too-large" },
  });
});

test("rejects hours from 24 on", () => {
  expect(parseDuration({ hours: "24", minutes: "00" })).toEqual({
    ok: false,
    errors: { hours: "too-large" },
  });
});

test("does not accept 00:00 as study time", () => {
  expect(parseDuration({ hours: "0", minutes: "00" })).toEqual({
    ok: false,
    errors: { total: "zero" },
  });
});

test("formats a total as HH:mm", () => {
  expect(formatDuration(90)).toBe("01:30");
  expect(formatDuration(135)).toBe("02:15");
  expect(formatDuration(5)).toBe("00:05");
  expect(formatDuration(MAX_DAILY_MINUTES)).toBe("23:59");
});

test("splits a total to fill the form", () => {
  expect(splitDuration(90)).toEqual({ hours: "1", minutes: "30" });
  expect(splitDuration(5)).toEqual({ hours: "0", minutes: "05" });
});
