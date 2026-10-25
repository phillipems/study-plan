import { afterEach, expect, test } from "vitest";
import { db } from "@/infrastructure/database/database";
import { addGoal, deleteGoal, listGoals } from "./goal-repository";

afterEach(async () => {
  await db.table("goals").clear();
});

test("deletes only the given goal", async () => {
  await addGoal({ id: "a", name: "Inglês", createdAt: "2026-01-01T10:00:00Z" });
  await addGoal({ id: "b", name: "Física", createdAt: "2026-01-02T10:00:00Z" });

  await deleteGoal("a");

  expect((await listGoals()).map((goal) => goal.id)).toEqual(["b"]);
});
