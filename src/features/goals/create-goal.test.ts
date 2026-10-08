import { afterEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { createGoal } from "./create-goal";
import { listGoals } from "./goal-repository";

afterEach(async () => {
  vi.useRealTimers();
  await db.table("goals").clear();
});

test("stores a valid goal with a generated id and creation date", async () => {
  const result = await createGoal({
    name: "  Aprender TypeScript ",
    description: "Tipos e generics",
  });

  expect(result).toEqual({
    ok: true,
    goal: {
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: "Aprender TypeScript",
      description: "Tipos e generics",
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/),
    },
  });
  expect(await listGoals()).toEqual([result.ok && result.goal]);
});

test("stores a goal without a description", async () => {
  await createGoal({ name: "Inglês" });

  const [goal] = await listGoals();
  expect(goal.name).toBe("Inglês");
  expect(goal).not.toHaveProperty("description");
});

test("does not store an invalid goal", async () => {
  const result = await createGoal({ name: "   " });

  expect(result).toEqual({ ok: false, errors: { name: "required" } });
  expect(await listGoals()).toEqual([]);
});

test("allows goals with the same name", async () => {
  await createGoal({ name: "Matemática" });
  await createGoal({ name: "Matemática" });

  const goals = await listGoals();
  expect(goals).toHaveLength(2);
  expect(goals[0].id).not.toBe(goals[1].id);
});

test("lists the most recent goal first", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  await createGoal({ name: "Primeiro" });
  vi.setSystemTime(new Date("2026-01-02T10:00:00Z"));
  await createGoal({ name: "Segundo" });

  expect((await listGoals()).map((goal) => goal.name)).toEqual([
    "Segundo",
    "Primeiro",
  ]);
});
