import { afterEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { createGoal } from "./create-goal";
import { editGoal } from "./edit-goal";
import { GOAL_NAME_MAX_LENGTH } from "./goal";
import type { Goal } from "./goal";
import { listGoals } from "./goal-repository";

afterEach(async () => {
  vi.useRealTimers();
  await db.table("goals").clear();
});

async function create(name: string, description?: string): Promise<Goal> {
  const result = await createGoal({ name, description });
  if (!result.ok) throw new Error("invalid test goal");
  return result.goal;
}

test("updates the name and description, trimming both", async () => {
  const goal = await create("Inglês", "Leitura");

  const result = await editGoal(goal.id, {
    name: "  Inglês técnico ",
    description: " Documentação ",
  });

  expect(result).toEqual({ ok: true });
  expect(await listGoals()).toEqual([
    { ...goal, name: "Inglês técnico", description: "Documentação" },
  ]);
});

test("removes the description when it is cleared", async () => {
  const goal = await create("Inglês", "Leitura");

  await editGoal(goal.id, { name: "Inglês", description: "   " });

  const [stored] = await listGoals();
  expect(stored).not.toHaveProperty("description");
});

test("keeps the id, the creation date and the position in the list", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  const first = await create("Primeiro");
  vi.setSystemTime(new Date("2026-01-02T10:00:00Z"));
  const second = await create("Segundo");
  vi.setSystemTime(new Date("2026-01-03T10:00:00Z"));

  await editGoal(first.id, { name: "Primeiro, revisado" });

  expect(await listGoals()).toEqual([
    second,
    { ...first, name: "Primeiro, revisado" },
  ]);
});

test.each([
  ["empty", ""],
  ["blank", "   "],
])("does not save an %s name", async (_, name) => {
  const goal = await create("Inglês");

  expect(await editGoal(goal.id, { name })).toEqual({
    ok: false,
    errors: { name: "required" },
  });
  expect(await listGoals()).toEqual([goal]);
});

test("does not save a name above the length limit", async () => {
  const goal = await create("Inglês");

  expect(
    await editGoal(goal.id, { name: "a".repeat(GOAL_NAME_MAX_LENGTH + 1) }),
  ).toEqual({ ok: false, errors: { name: "too-long" } });
  expect(await listGoals()).toEqual([goal]);
});

test("rejects when the goal no longer exists", async () => {
  await expect(editGoal("missing-id", { name: "Inglês" })).rejects.toThrow();
  expect(await listGoals()).toEqual([]);
});
