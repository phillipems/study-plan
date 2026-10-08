export const GOAL_NAME_MAX_LENGTH = 100;
export const GOAL_DESCRIPTION_MAX_LENGTH = 500;

export type Goal = {
  id: string;
  name: string;
  description?: string;
  /** ISO 8601 timestamp (UTC). */
  createdAt: string;
};

export type GoalInput = {
  name: string;
  description?: string;
};

export type GoalInputErrors = {
  name?: "required" | "too-long";
  description?: "too-long";
};

export type GoalInputValidation =
  { ok: true; value: GoalInput } | { ok: false; errors: GoalInputErrors };

/** Trims both fields and validates them; limits apply to the trimmed text. */
export function validateGoalInput(input: GoalInput): GoalInputValidation {
  const name = input.name.trim();
  const description = input.description?.trim() ?? "";
  const errors: GoalInputErrors = {};

  if (name.length === 0) {
    errors.name = "required";
  } else if (name.length > GOAL_NAME_MAX_LENGTH) {
    errors.name = "too-long";
  }

  if (description.length > GOAL_DESCRIPTION_MAX_LENGTH) {
    errors.description = "too-long";
  }

  if (errors.name || errors.description) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: description.length > 0 ? { name, description } : { name },
  };
}
