import { expect, test } from "vitest";
import {
  SUBJECT_DESCRIPTION_MAX_LENGTH,
  SUBJECT_NAME_MAX_LENGTH,
  validateSubjectInput,
} from "./subject";

test("accepts a name and one goal, without a description", () => {
  expect(validateSubjectInput({ name: "Python", goalIds: ["g1"] })).toEqual({
    ok: true,
    value: { name: "Python", goalIds: ["g1"] },
  });
});

test("trims the name and the description", () => {
  expect(
    validateSubjectInput({
      name: "  Python ",
      description: " Linguagem ",
      goalIds: ["g1"],
    }),
  ).toEqual({
    ok: true,
    value: { name: "Python", description: "Linguagem", goalIds: ["g1"] },
  });
});

test("leaves out a description made only of spaces", () => {
  expect(
    validateSubjectInput({
      name: "Python",
      description: "  ",
      goalIds: ["g1"],
    }),
  ).toEqual({ ok: true, value: { name: "Python", goalIds: ["g1"] } });
});

test.each(["", "   "])("rejects the blank name %j", (name) => {
  expect(validateSubjectInput({ name, goalIds: ["g1"] })).toEqual({
    ok: false,
    errors: { name: "required" },
  });
});

test("accepts a name at the length limit and rejects one above it", () => {
  const atLimit = "a".repeat(SUBJECT_NAME_MAX_LENGTH);

  expect(validateSubjectInput({ name: atLimit, goalIds: ["g1"] }).ok).toBe(
    true,
  );
  expect(
    validateSubjectInput({ name: `${atLimit}a`, goalIds: ["g1"] }),
  ).toEqual({ ok: false, errors: { name: "too-long" } });
});

test("accepts a description at the length limit and rejects one above it", () => {
  const atLimit = "a".repeat(SUBJECT_DESCRIPTION_MAX_LENGTH);
  const input = { name: "Python", goalIds: ["g1"] };

  expect(validateSubjectInput({ ...input, description: atLimit }).ok).toBe(
    true,
  );
  expect(
    validateSubjectInput({ ...input, description: `${atLimit}a` }),
  ).toEqual({ ok: false, errors: { description: "too-long" } });
});

test("requires at least one goal", () => {
  expect(validateSubjectInput({ name: "Python", goalIds: [] })).toEqual({
    ok: false,
    errors: { goalIds: "required" },
  });
});

test("removes repeated goal ids, keeping the first occurrence order", () => {
  expect(
    validateSubjectInput({ name: "Python", goalIds: ["g2", "g1", "g2", "g1"] }),
  ).toEqual({ ok: true, value: { name: "Python", goalIds: ["g2", "g1"] } });
});

test("reports the errors of every field together", () => {
  expect(
    validateSubjectInput({
      name: " ",
      description: "a".repeat(SUBJECT_DESCRIPTION_MAX_LENGTH + 1),
      goalIds: [],
    }),
  ).toEqual({
    ok: false,
    errors: { name: "required", description: "too-long", goalIds: "required" },
  });
});
