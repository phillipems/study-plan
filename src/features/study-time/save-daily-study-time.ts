import { isDateKey, isFutureDate, toDateKey } from "./calendar";
import { parseDuration } from "./duration";
import type { DurationErrors, DurationInput } from "./duration";
import { putDailyStudyTime } from "./study-time-repository";

export type SaveDailyStudyTimeErrors = DurationErrors & {
  subject?: "not-found";
  /** Study time cannot be recorded for a day that has not come yet. */
  date?: "future";
};

export type SaveDailyStudyTimeResult =
  | { ok: true; durationMinutes: number }
  | { ok: false; errors: SaveDailyStudyTimeErrors };

/**
 * Validates the duration and stores it as the total of the subject on that
 * date, replacing any previous total. Dates after `today` (the local calendar
 * date by default) are refused. Rejects when it cannot be persisted.
 */
export async function saveDailyStudyTime(
  subjectId: string,
  date: string,
  input: DurationInput,
  today: string = toDateKey(new Date()),
): Promise<SaveDailyStudyTimeResult> {
  if (!isDateKey(date)) {
    throw new Error(`Invalid date key: ${date}`);
  }

  if (isFutureDate(date, today)) {
    return { ok: false, errors: { date: "future" } };
  }

  const duration = parseDuration(input);
  if (!duration.ok) {
    return duration;
  }

  const outcome = await putDailyStudyTime(subjectId, date, duration.minutes);
  if (outcome === "missing-subject") {
    return { ok: false, errors: { subject: "not-found" } };
  }

  return { ok: true, durationMinutes: duration.minutes };
}
