import { useId } from "react";
import type { Ref } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

// Light fields meant for the dark panel (.surface-ink) that holds the forms.
const fieldClass =
  "border-transparent bg-paper text-base text-ink focus-visible:border-primary focus-visible:ring-primary md:text-base";

type NameDescriptionFieldsProps = {
  name: string;
  description: string;
  /** Validation message shown under the name; the field is marked invalid. */
  nameError?: string;
  /** Validation message shown under the description; the field is marked invalid. */
  descriptionError?: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  nameRef: Ref<HTMLInputElement>;
  descriptionRef: Ref<HTMLTextAreaElement>;
};

/** "Nome" and "Descrição (opcional)" fields, with their validation messages. */
export function NameDescriptionFields({
  name,
  description,
  nameError,
  descriptionError,
  onNameChange,
  onDescriptionChange,
  nameRef,
  descriptionRef,
}: NameDescriptionFieldsProps) {
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
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
        />
        {nameError && (
          <p id={nameErrorId} className="text-sm text-destructive">
            {nameError}
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
          aria-invalid={descriptionError ? true : undefined}
          aria-describedby={descriptionError ? descriptionErrorId : undefined}
        />
        {descriptionError && (
          <p id={descriptionErrorId} className="text-sm text-destructive">
            {descriptionError}
          </p>
        )}
      </div>
    </>
  );
}
