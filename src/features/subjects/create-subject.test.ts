import { afterEach, expect, test, vi } from "vitest";
import { listGoals } from "@/features/goals";
import { db } from "@/infrastructure/database/database";
import { createSubject } from "./create-subject";
import { listSubjects } from "./subject-repository";

const goals = [
  {
    id: "g-backend",
    name: "Desenvolvimento backend",
    createdAt: "2026-01-01T10:00:00.000Z",
  },
  { id: "g-cert", name: "Certificação", createdAt: "2026-01-02T10:00:00.000Z" },
];

afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  await db.table("subjects").clear();
  await db.table("goals").clear();
});

async function seedGoals() {
  await db.table("goals").bulkAdd(goals);
}

test("stores a subject linked to one goal, with a generated id and date", async () => {
  await seedGoals();

  const result = await createSubject({
    name: " Python ",
    description: "Linguagem",
    goalIds: ["g-backend"],
  });

  expect(result).toEqual({
    ok: true,
    subject: {
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: "Python",
      description: "Linguagem",
      goalIds: ["g-backend"],
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/),
    },
  });
  expect(await listSubjects()).toEqual([result.ok && result.subject]);
});

test("stores a subject linked to several goals", async () => {
  await seedGoals();

  await createSubject({ name: "Python", goalIds: ["g-backend", "g-cert"] });

  const [subject] = await listSubjects();
  expect(subject.goalIds).toEqual(["g-backend", "g-cert"]);
  expect(subject).not.toHaveProperty("description");
});

test("stores each goal link once, even when it is repeated", async () => {
  await seedGoals();

  await createSubject({
    name: "Python",
    goalIds: ["g-cert", "g-cert", "g-backend", "g-cert"],
  });

  expect((await listSubjects())[0].goalIds).toEqual(["g-cert", "g-backend"]);
});

test("can be found by any of its goals", async () => {
  await seedGoals();
  await createSubject({ name: "Python", goalIds: ["g-backend", "g-cert"] });

  const byGoal = await db
    .table("subjects")
    .where("goalIds")
    .equals("g-cert")
    .toArray();
  expect(byGoal.map((subject) => subject.name)).toEqual(["Python"]);
});

test("does not store a subject without goals", async () => {
  await seedGoals();

  expect(await createSubject({ name: "Python", goalIds: [] })).toEqual({
    ok: false,
    errors: { goalIds: "required" },
  });
  expect(await listSubjects()).toEqual([]);
});

test("does not store a subject linked to a goal that does not exist", async () => {
  await seedGoals();

  expect(
    await createSubject({ name: "Python", goalIds: ["g-backend", "g-gone"] }),
  ).toEqual({ ok: false, errors: { goalIds: "not-found" } });
  expect(await listSubjects()).toEqual([]);
});

test("rejects and stores nothing when the write fails", async () => {
  await seedGoals();
  vi.spyOn(db.table("subjects"), "add").mockRejectedValueOnce(
    new Error("write failed"),
  );

  await expect(
    createSubject({ name: "Python", goalIds: ["g-backend", "g-cert"] }),
  ).rejects.toThrow("write failed");
  expect(await listSubjects()).toEqual([]);
  expect(await listGoals()).toHaveLength(2);
});

test("lists the most recent subject first", async () => {
  await seedGoals();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-02-01T10:00:00Z"));
  await createSubject({ name: "Python", goalIds: ["g-backend"] });
  vi.setSystemTime(new Date("2026-02-02T10:00:00Z"));
  await createSubject({ name: "SQL", goalIds: ["g-backend"] });

  expect((await listSubjects()).map((subject) => subject.name)).toEqual([
    "SQL",
    "Python",
  ]);
});
