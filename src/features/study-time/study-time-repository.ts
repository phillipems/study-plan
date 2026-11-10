import { getSubject } from "@/features/subjects";
import { db } from "@/infrastructure/database/database";
import { addDays } from "./calendar";
import type { DailyStudyTime } from "./daily-study-time";

const studyTime = db.table<DailyStudyTime, [string, string]>("studyTime");

/** The totals of one subject in the week that starts on `monday`. */
export function listWeek(
  subjectId: string,
  monday: string,
): Promise<DailyStudyTime[]> {
  return studyTime
    .where("[subjectId+date]")
    .between([subjectId, monday], [subjectId, addDays(monday, 6)], true, true)
    .toArray();
}

/**
 * Creates or replaces the total of a subject on a date, only if the subject
 * exists. The check and the write share one transaction. Rejects when the
 * write fails; the previous total is kept in that case.
 */
export function putDailyStudyTime(
  subjectId: string,
  date: string,
  durationMinutes: number,
): Promise<"saved" | "missing-subject"> {
  // "subjects" joins the transaction scope only; its data is read through the
  // public API of the subjects feature.
  return db.transaction("rw", ["studyTime", "subjects"], async () => {
    if (!(await getSubject(subjectId))) {
      return "missing-subject";
    }

    const now = new Date().toISOString();
    const existing = await studyTime.get([subjectId, date]);
    await studyTime.put({
      subjectId,
      date,
      durationMinutes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    return "saved";
  });
}

export async function deleteDailyStudyTime(
  subjectId: string,
  date: string,
): Promise<void> {
  await studyTime.delete([subjectId, date]);
}
