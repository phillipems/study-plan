import Dexie from "dexie";
import { beforeEach, expect, test } from "vitest";

const goal = { id: "g1", name: "Inglês", createdAt: "2026-01-01T10:00:00Z" };
const subject = {
  id: "s1",
  name: "Python",
  goalIds: ["g1"],
  createdAt: "2026-01-02T10:00:00Z",
};

beforeEach(async () => {
  const { db } = await import("./database");
  db.close();
  await Dexie.delete("study-plan");
});

test("upgrades a version 1 database without losing its goals", async () => {
  // A database as it was before subjects existed.
  const legacy = new Dexie("study-plan");
  legacy.version(1).stores({ goals: "id, createdAt" });
  await legacy.table("goals").add(goal);
  legacy.close();

  const { db } = await import("./database");
  await db.open();

  expect(db.verno).toBe(3);
  expect(await db.table("goals").toArray()).toEqual([goal]);
  expect(await db.table("subjects").count()).toBe(0);
  expect(await db.table("studyTime").count()).toBe(0);
  db.close();
});

test("upgrades a version 2 database without losing goals or subjects", async () => {
  // A database as it was before study time existed.
  const legacy = new Dexie("study-plan");
  legacy.version(1).stores({ goals: "id, createdAt" });
  legacy.version(2).stores({
    goals: "id, createdAt",
    subjects: "id, createdAt, *goalIds",
  });
  await legacy.table("goals").add(goal);
  await legacy.table("subjects").add(subject);
  legacy.close();

  const { db } = await import("./database");
  await db.open();

  expect(db.verno).toBe(3);
  expect(await db.table("goals").toArray()).toEqual([goal]);
  expect(await db.table("subjects").toArray()).toEqual([subject]);
  expect(await db.table("studyTime").count()).toBe(0);
  db.close();
});
