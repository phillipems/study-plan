import { validateGoalInput } from "./goal";
import type { Goal, GoalInput, GoalInputErrors } from "./goal";
import { addGoal } from "./goal-repository";

export type CreateGoalResult =
  { ok: true; goal: Goal } | { ok: false; errors: GoalInputErrors };

/** Rejects when the goal cannot be persisted. */
export async function createGoal(input: GoalInput): Promise<CreateGoalResult> {
  const validation = validateGoalInput(input);
  if (!validation.ok) {
    return validation;
  }

  const goal: Goal = {
    id: crypto.randomUUID(),
    ...validation.value,
    createdAt: new Date().toISOString(),
  };
  await addGoal(goal);

  return { ok: true, goal };
}
