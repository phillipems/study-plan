import { db } from "@/infrastructure/database/database";
import type { Goal, GoalInput } from "./goal";

const goals = db.table<Goal, string>("goals");

export async function addGoal(goal: Goal): Promise<void> {
  await goals.add(goal);
}

/** Most recent first. */
export function listGoals(): Promise<Goal[]> {
  return goals.orderBy("createdAt").reverse().toArray();
}

/**
 * Replaces the name and description of an existing goal; id and creation date
 * are kept. Rejects when the goal no longer exists.
 */
export async function updateGoal(id: string, value: GoalInput): Promise<void> {
  // An undefined description removes the property, as for a goal created without one.
  const updated = await goals.update(id, {
    name: value.name,
    description: value.description,
  });
  if (updated === 0) {
    throw new Error(`Goal ${id} not found`);
  }
}

export async function deleteGoal(id: string): Promise<void> {
  await goals.delete(id);
}
