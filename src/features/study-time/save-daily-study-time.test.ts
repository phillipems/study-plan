import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { saveDailyStudyTime } from "./save-daily-study-time";
import { deleteDailyStudyTime, listWeek } from "./study-time-repository";

const python = {
  id: "s-python",
  name: "Python",
  goalIds: ["g1"],
  createdAt: "2026-01-01T10:00:00.000Z",
};
const sql = {
  id: "s-sql",
  name: "SQL",
  goalIds: ["g1"],
  createdAt: "2026-01-02T10:00:00.000Z",
};
const monday = "2026-11-09";

beforeEach(() => {
  // Friday, 20/11/2026: every date used below is in the past.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 20, 12, 0));
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  await db.table("studyTime").clear();
  await db.table("subjects").clear();
});

async function seedSubjects() {
  await db.table("subjects").bulkAdd([python, sql]);
}

test("stores 01:30 as 90 minutes for the subject and date", async () => {
  await seedSubjects();

  const result = await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "01",
    minutes: "30",
  });

  expect(result).toEqual({ ok: true, durationMinutes: 90 });
  expect(await listWeek(python.id, monday)).toEqual([
    {
      subjectId: python.id,
      date: "2026-11-10",
      durationMinutes: 90,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  ]);
});

test("replaces the total of the day instead of adding to it", async () => {
  await seedSubjects();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
  await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "1",
    minutes: "30",
  });
  vi.setSystemTime(new Date("2026-11-10T18:00:00Z"));

  await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "2",
    minutes: "15",
  });

  expect(await listWeek(python.id, monday)).toEqual([
    {
      subjectId: python.id,
      date: "2026-11-10",
      durationMinutes: 135,
      createdAt: "2026-11-10T12:00:00.000Z",
      updatedAt: "2026-11-10T18:00:00.000Z",
    },
  ]);
});

test("removes the total of a day", async () => {
  await seedSubjects();
  await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "1",
    minutes: "0",
  });

  await deleteDailyStudyTime(python.id, "2026-11-10");

  expect(await listWeek(python.id, monday)).toEqual([]);
});

test("keeps the totals of each subject apart", async () => {
  await seedSubjects();
  await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "1",
    minutes: "0",
  });
  await saveDailyStudyTime(sql.id, "2026-11-10", { hours: "0", minutes: "45" });

  expect(
    (await listWeek(python.id, monday)).map((t) => t.durationMinutes),
  ).toEqual([60]);
  expect(
    (await listWeek(sql.id, monday)).map((t) => t.durationMinutes),
  ).toEqual([45]);
});

test("reads only the requested week, Monday to Sunday", async () => {
  await seedSubjects();
  for (const date of ["2026-11-08", "2026-11-09", "2026-11-15", "2026-11-16"]) {
    await saveDailyStudyTime(python.id, date, { hours: "1", minutes: "0" });
  }

  expect((await listWeek(python.id, monday)).map((t) => t.date)).toEqual([
    "2026-11-09",
    "2026-11-15",
  ]);
});

test("does not store invalid durations", async () => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime(python.id, "2026-11-10", {
      hours: "1",
      minutes: "60",
    }),
  ).toEqual({ ok: false, errors: { minutes: "too-large" } });
  expect(
    await saveDailyStudyTime(python.id, "2026-11-10", {
      hours: "0",
      minutes: "0",
    }),
  ).toEqual({ ok: false, errors: { total: "zero" } });
  expect(await listWeek(python.id, monday)).toEqual([]);
});

test("does not store time for a subject that does not exist", async () => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime("s-gone", "2026-11-10", {
      hours: "1",
      minutes: "0",
    }),
  ).toEqual({ ok: false, errors: { subject: "not-found" } });
  expect(await db.table("studyTime").count()).toBe(0);
});

test("keeps the previous total when the write fails", async () => {
  await seedSubjects();
  await saveDailyStudyTime(python.id, "2026-11-10", {
    hours: "1",
    minutes: "30",
  });
  vi.spyOn(db.table("studyTime"), "put").mockRejectedValueOnce(
    new Error("write failed"),
  );

  await expect(
    saveDailyStudyTime(python.id, "2026-11-10", { hours: "2", minutes: "0" }),
  ).rejects.toThrow("write failed");
  expect(
    (await listWeek(python.id, monday)).map((t) => t.durationMinutes),
  ).toEqual([90]);
});

test("does not store time for a date after today", async () => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime(
      python.id,
      "2026-11-12",
      { hours: "1", minutes: "0" },
      "2026-11-11",
    ),
  ).toEqual({ ok: false, errors: { date: "future" } });
  expect(await db.table("studyTime").count()).toBe(0);
});

test("refuses the future date before validating the duration", async () => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime(
      python.id,
      "2026-11-12",
      { hours: "", minutes: "" },
      "2026-11-11",
    ),
  ).toEqual({ ok: false, errors: { date: "future" } });
});

test.each([
  ["the next month", "2026-11-30", "2026-12-01"],
  ["the next year", "2025-12-31", "2026-01-01"],
])("does not store time for a day in %s", async (_, today, date) => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime(
      python.id,
      date,
      { hours: "1", minutes: "0" },
      today,
    ),
  ).toEqual({ ok: false, errors: { date: "future" } });
  expect(await db.table("studyTime").count()).toBe(0);
});

test.each([
  ["today", "2026-01-01", "2026-01-01"],
  ["yesterday, across a year change", "2026-01-01", "2025-12-31"],
  ["yesterday, across a month change", "2026-12-01", "2026-11-30"],
])("stores time for %s", async (_, today, date) => {
  await seedSubjects();

  expect(
    await saveDailyStudyTime(
      python.id,
      date,
      { hours: "1", minutes: "0" },
      today,
    ),
  ).toEqual({ ok: true, durationMinutes: 60 });
});

test("uses the local date of the device as today by default", async () => {
  await seedSubjects();
  // 23:30 on 20/11 local time: 21/11 is still in the future.
  vi.setSystemTime(new Date(2026, 10, 20, 23, 30));

  expect(
    await saveDailyStudyTime(python.id, "2026-11-21", {
      hours: "1",
      minutes: "0",
    }),
  ).toEqual({ ok: false, errors: { date: "future" } });
  expect(
    await saveDailyStudyTime(python.id, "2026-11-20", {
      hours: "1",
      minutes: "0",
    }),
  ).toEqual({ ok: true, durationMinutes: 60 });
});
