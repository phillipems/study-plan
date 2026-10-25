import type { ComponentProps } from "react";
import { NameDescriptionFields } from "@/shared/forms/name-description-fields";
import { GOAL_DESCRIPTION_MAX_LENGTH, GOAL_NAME_MAX_LENGTH } from "../goal";
import type { GoalInputErrors } from "../goal";

const nameMessages: Record<NonNullable<GoalInputErrors["name"]>, string> = {
  required: "Informe o nome do objetivo.",
  "too-long": `O nome deve ter no máximo ${GOAL_NAME_MAX_LENGTH} caracteres.`,
};

const descriptionMessages: Record<
  NonNullable<GoalInputErrors["description"]>,
  string
> = {
  "too-long": `A descrição deve ter no máximo ${GOAL_DESCRIPTION_MAX_LENGTH} caracteres.`,
};

type GoalFieldsProps = Omit<
  ComponentProps<typeof NameDescriptionFields>,
  "nameError" | "descriptionError"
> & {
  errors: GoalInputErrors;
};

/** Name and description fields of a goal, with its validation messages. */
export function GoalFields({ errors, ...props }: GoalFieldsProps) {
  return (
    <NameDescriptionFields
      {...props}
      nameError={errors.name && nameMessages[errors.name]}
      descriptionError={
        errors.description && descriptionMessages[errors.description]
      }
    />
  );
}
