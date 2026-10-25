import Dexie from "dexie";
import { expect, test } from "vitest";

test("upgrades a version 1 database without losing its goals", async () => {
  // A database as it was before subjects existed.
  const legacy = new Dexie("study-plan");
  legacy.version(1).stores({ goals: "id, createdAt" });
  const goal = { id: "g1", name: "Inglês", createdAt: "2026-01-01T10:00:00Z" };
  await legacy.table("goals").add(goal);
  legacy.close();

  const { db } = await import("./database");
  await db.open();

  expect(db.verno).toBe(2);
  expect(await db.table("goals").toArray()).toEqual([goal]);
  expect(await db.table("subjects").count()).toBe(0);
  db.close();
});
