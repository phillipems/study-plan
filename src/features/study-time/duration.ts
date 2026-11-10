/** Longest total for a single day: 23:59. */
export const MAX_DAILY_MINUTES = 23 * 60 + 59;

export type DurationInput = {
  hours: string;
  minutes: string;
};

export type DurationErrors = {
  hours?: "required" | "invalid" | "too-large";
  minutes?: "required" | "invalid" | "too-large";
  /** Both fields are valid, but the total is 00:00. */
  total?: "zero";
};

export type DurationValidation =
  { ok: true; minutes: number } | { ok: false; errors: DurationErrors };

const DIGITS = /^\d+$/;

function parseField(
  value: string,
  max: number,
): number | "required" | "invalid" | "too-large" {
  const text = value.trim();
  if (text === "") return "required";
  // Only digits: rejects signs, decimals, exponents and letters.
  if (!DIGITS.test(text)) return "invalid";
  const number = Number(text);
  return number > max ? "too-large" : number;
}

/** Parses hours (0–23) and minutes (0–59) into a total greater than zero. */
export function parseDuration(input: DurationInput): DurationValidation {
  const hours = parseField(input.hours, 23);
  const minutes = parseField(input.minutes, 59);
  const errors: DurationErrors = {};

  if (typeof hours === "string") errors.hours = hours;
  if (typeof minutes === "string") errors.minutes = minutes;
  if (typeof hours === "number" && typeof minutes === "number") {
    const total = hours * 60 + minutes;
    if (total === 0) return { ok: false, errors: { total: "zero" } };
    return { ok: true, minutes: total };
  }

  return { ok: false, errors };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** 90 → "01:30". */
export function formatDuration(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/** 90 → { hours: "1", minutes: "30" }, to fill the form fields. */
export function splitDuration(totalMinutes: number): DurationInput {
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: pad(totalMinutes % 60),
  };
}
