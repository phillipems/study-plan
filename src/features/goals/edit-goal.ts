import { validateGoalInput } from "./goal";
import type { GoalInput, GoalInputErrors } from "./goal";
import { updateGoal } from "./goal-repository";

export type EditGoalResult =
  { ok: true } | { ok: false; errors: GoalInputErrors };

/** Rejects when the goal cannot be persisted or no longer exists. */
export async function editGoal(
  id: string,
  input: GoalInput,
): Promise<EditGoalResult> {
  const validation = validateGoalInput(input);
  if (!validation.ok) {
    return validation;
  }

  await updateGoal(id, validation.value);

  return { ok: true };
}
