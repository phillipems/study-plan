/**
 * Total time studied for one subject on one calendar day. There is at most
 * one per subject and date: saving again replaces the total.
 */
export type DailyStudyTime = {
  subjectId: string;
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  /** Whole minutes, from 1 to 1439 (23:59). */
  durationMinutes: number;
  /** ISO 8601 timestamps (UTC); createdAt is kept when the total changes. */
  createdAt: string;
  updatedAt: string;
};
