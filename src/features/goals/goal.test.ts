import { expect, test } from "vitest";
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_NAME_MAX_LENGTH,
  validateGoalInput,
} from "./goal";

test("accepts a name without a description", () => {
  expect(validateGoalInput({ name: "Aprender TypeScript" })).toEqual({
    ok: true,
    value: { name: "Aprender TypeScript" },
  });
});

test("trims the name and the description", () => {
  expect(
    validateGoalInput({
      name: "  Álgebra linear ",
      description: "\n Vetores ",
    }),
  ).toEqual({
    ok: true,
    value: { name: "Álgebra linear", description: "Vetores" },
  });
});

test("leaves out a description made only of spaces", () => {
  expect(validateGoalInput({ name: "Inglês", description: "   " })).toEqual({
    ok: true,
    value: { name: "Inglês" },
  });
});

test.each(["", "   ", "\t\n"])("rejects the blank name %j", (name) => {
  expect(validateGoalInput({ name })).toEqual({
    ok: false,
    errors: { name: "required" },
  });
});

test("accepts a name at the length limit and rejects one above it", () => {
  const atLimit = "a".repeat(GOAL_NAME_MAX_LENGTH);

  expect(validateGoalInput({ name: atLimit }).ok).toBe(true);
  expect(validateGoalInput({ name: `${atLimit}a` })).toEqual({
    ok: false,
    errors: { name: "too-long" },
  });
});

test("accepts a description at the length limit and rejects one above it", () => {
  const atLimit = "a".repeat(GOAL_DESCRIPTION_MAX_LENGTH);

  expect(validateGoalInput({ name: "Física", description: atLimit }).ok).toBe(
    true,
  );
  expect(
    validateGoalInput({ name: "Física", description: `${atLimit}a` }),
  ).toEqual({ ok: false, errors: { description: "too-long" } });
});

test("does not count surrounding spaces towards the limits", () => {
  const name = "a".repeat(GOAL_NAME_MAX_LENGTH);
  const description = "a".repeat(GOAL_DESCRIPTION_MAX_LENGTH);

  expect(
    validateGoalInput({ name: `  ${name}  `, description: ` ${description} ` }),
  ).toEqual({ ok: true, value: { name, description } });
});

test("reports the errors of both fields together", () => {
  expect(
    validateGoalInput({
      name: " ",
      description: "a".repeat(GOAL_DESCRIPTION_MAX_LENGTH + 1),
    }),
  ).toEqual({
    ok: false,
    errors: { name: "required", description: "too-long" },
  });
});
