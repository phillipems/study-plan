import { useId } from "react";
import type { Ref } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { GOAL_DESCRIPTION_MAX_LENGTH, GOAL_NAME_MAX_LENGTH } from "../goal";
import type { GoalInputErrors } from "../goal";

const nameMessages = {
  required: "Informe o nome do objetivo.",
  "too-long": `O nome deve ter no máximo ${GOAL_NAME_MAX_LENGTH} caracteres.`,
};

const descriptionMessages = {
  "too-long": `A descrição deve ter no máximo ${GOAL_DESCRIPTION_MAX_LENGTH} caracteres.`,
};

// Light fields meant for the dark panel (.surface-ink) used by both goal forms.
const fieldClass =
  "border-transparent bg-paper text-base text-ink focus-visible:border-primary focus-visible:ring-primary md:text-base";

type GoalFieldsProps = {
  name: string;
  description: string;
  errors: GoalInputErrors;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  nameRef: Ref<HTMLInputElement>;
  descriptionRef: Ref<HTMLTextAreaElement>;
};

/** Name and description fields, with their validation messages. */
export function GoalFields({
  name,
  description,
  errors,
  onNameChange,
  onDescriptionChange,
  nameRef,
  descriptionRef,
}: GoalFieldsProps) {
  const id = useId();
  const nameErrorId = `${id}-name-error`;
  const descriptionErrorId = `${id}-description-error`;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          ref={nameRef}
          id={`${id}-name`}
          value={name}
          className={`h-11 ${fieldClass}`}
          onChange={(event) => onNameChange(event.target.value)}
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
        />
        {errors.name && (
          <p id={nameErrorId} className="text-sm text-destructive">
            {nameMessages[errors.name]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-description`}>Descrição (opcional)</Label>
        <Textarea
          ref={descriptionRef}
          id={`${id}-description`}
          value={description}
          className={`min-h-28 wrap-anywhere ${fieldClass}`}
          onChange={(event) => onDescriptionChange(event.target.value)}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? descriptionErrorId : undefined}
        />
        {errors.description && (
          <p id={descriptionErrorId} className="text-sm text-destructive">
            {descriptionMessages[errors.description]}
          </p>
        )}
      </div>
    </>
  );
}
