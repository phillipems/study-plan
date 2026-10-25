import { validateSubjectInput } from "./subject";
import type { Subject, SubjectInput, SubjectInputErrors } from "./subject";
import { addSubjectWithGoals } from "./subject-repository";

export type CreateSubjectResult =
  { ok: true; subject: Subject } | { ok: false; errors: SubjectInputErrors };

/** Rejects when the subject cannot be persisted. */
export async function createSubject(
  input: SubjectInput,
): Promise<CreateSubjectResult> {
  const validation = validateSubjectInput(input);
  if (!validation.ok) {
    return validation;
  }

  const subject: Subject = {
    id: crypto.randomUUID(),
    ...validation.value,
    createdAt: new Date().toISOString(),
  };

  if ((await addSubjectWithGoals(subject)) === "missing-goals") {
    return { ok: false, errors: { goalIds: "not-found" } };
  }

  return { ok: true, subject };
}
