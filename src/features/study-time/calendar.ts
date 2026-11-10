// Calendar dates are handled as "YYYY-MM-DD" keys. "Today" is read once from
// the local clock; every other calculation works on the year/month/day triple
// in UTC, which has no daylight saving time, so adding a day never skips or
// repeats one.

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const WEEKDAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const WEEKDAY_LONG = [
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
  "domingo",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** The local calendar date of `date`, as a "YYYY-MM-DD" key. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toUtc(key: string): Date | null {
  const match = DATE_KEY.exec(key);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects dates such as 2026-02-30, which Date would roll over.
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

function fromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function requireUtc(key: string): Date {
  const date = toUtc(key);
  if (!date) throw new Error(`Invalid date key: ${key}`);
  return date;
}

export function isDateKey(value: string): boolean {
  return toUtc(value) !== null;
}

export function addDays(key: string, days: number): string {
  const date = requireUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

export function addWeeks(key: string, weeks: number): string {
  return addDays(key, weeks * 7);
}

/** Position in a Monday-first week: 0 = Monday … 6 = Sunday. */
function weekdayIndex(key: string): number {
  return (requireUtc(key).getUTCDay() + 6) % 7;
}

/** The Monday of the week that contains `key`. */
export function startOfWeek(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

/** The seven dates of the week, Monday to Sunday. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Whether `date` comes after `today` (both "YYYY-MM-DD" keys). */
export function isFutureDate(date: string, today: string): boolean {
  // Keys sort in calendar order, across months and years.
  return date > today;
}

export function isFutureWeek(monday: string, today: string): boolean {
  return monday > startOfWeek(today);
}

/**
 * The Monday of the week to show for a `week` URL parameter: the current week
 * when it is missing, invalid or in the future; otherwise the week that
 * contains the given date.
 */
export function resolveWeek(param: string | null, today: string): string {
  const current = startOfWeek(today);
  if (param === null || !isDateKey(param)) return current;
  const monday = startOfWeek(param);
  return monday > current ? current : monday;
}

function dayMonth(key: string): string {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

/** Short label of a day, such as { weekday: "SEG", date: "09/11" }. */
export function formatDay(key: string) {
  return { weekday: WEEKDAY_SHORT[weekdayIndex(key)], date: dayMonth(key) };
}

/** Full label for assistive technology, such as "segunda-feira, 09/11/2026". */
export function formatLongDate(key: string): string {
  return `${WEEKDAY_LONG[weekdayIndex(key)]}, ${dayMonth(key)}/${key.slice(0, 4)}`;
}

/**
 * "09/11 – 15/11/2026", or with both years when the week crosses into a new
 * year: "29/12/2025 – 04/01/2026".
 */
export function formatWeekRange(monday: string): string {
  const sunday = addDays(monday, 6);
  const startYear = monday.slice(0, 4);
  const endYear = sunday.slice(0, 4);
  const start =
    startYear === endYear
      ? dayMonth(monday)
      : `${dayMonth(monday)}/${startYear}`;
  return `${start} – ${dayMonth(sunday)}/${endYear}`;
}
