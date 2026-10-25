export const SUBJECT_NAME_MAX_LENGTH = 100;
export const SUBJECT_DESCRIPTION_MAX_LENGTH = 500;

export type Subject = {
  /** Stable id: future study time entries will point to it. */
  id: string;
  name: string;
  description?: string;
  /** Ids of the linked goals: at least one, without repetition. */
  goalIds: string[];
  /** ISO 8601 timestamp (UTC). */
  createdAt: string;
};

export type SubjectInput = {
  name: string;
  description?: string;
  goalIds: string[];
};

export type SubjectInputErrors = {
  name?: "required" | "too-long";
  description?: "too-long";
  goalIds?: "required" | "not-found";
};

export type SubjectInputValidation =
  { ok: true; value: SubjectInput } | { ok: false; errors: SubjectInputErrors };

/**
 * Trims the text fields, removes repeated goal ids and validates the result;
 * limits apply to the trimmed text.
 */
export function validateSubjectInput(
  input: SubjectInput,
): SubjectInputValidation {
  const name = input.name.trim();
  const description = input.description?.trim() ?? "";
  const goalIds = [...new Set(input.goalIds)];
  const errors: SubjectInputErrors = {};

  if (name.length === 0) {
    errors.name = "required";
  } else if (name.length > SUBJECT_NAME_MAX_LENGTH) {
    errors.name = "too-long";
  }

  if (description.length > SUBJECT_DESCRIPTION_MAX_LENGTH) {
    errors.description = "too-long";
  }

  if (goalIds.length === 0) {
    errors.goalIds = "required";
  }

  if (errors.name || errors.description || errors.goalIds) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value:
      description.length > 0
        ? { name, description, goalIds }
        : { name, goalIds },
  };
}
