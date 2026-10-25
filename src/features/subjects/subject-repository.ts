import { listGoals } from "@/features/goals";
import { db } from "@/infrastructure/database/database";
import type { Subject } from "./subject";

const subjects = db.table<Subject, string>("subjects");

/**
 * Stores the subject only if every linked goal still exists. The check and the
 * write share one transaction, so a goal deleted meanwhile cannot slip through.
 * Rejects when the write fails; nothing is stored in that case.
 */
export function addSubjectWithGoals(
  subject: Subject,
): Promise<"added" | "missing-goals"> {
  // "goals" joins the transaction scope only; its data is read through the
  // public API of the goals feature.
  return db.transaction("rw", ["subjects", "goals"], async () => {
    const existing = new Set((await listGoals()).map((goal) => goal.id));
    if (!subject.goalIds.every((id) => existing.has(id))) {
      return "missing-goals";
    }

    await subjects.add(subject);
    return "added";
  });
}

/** Most recent first. */
export function listSubjects(): Promise<Subject[]> {
  return subjects.orderBy("createdAt").reverse().toArray();
}
