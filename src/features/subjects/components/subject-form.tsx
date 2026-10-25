import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import type { Goal } from "@/features/goals";
import { NameDescriptionFields } from "@/shared/forms/name-description-fields";
import { Button } from "@/shared/ui/button";
import { createSubject } from "../create-subject";
import {
  SUBJECT_DESCRIPTION_MAX_LENGTH,
  SUBJECT_NAME_MAX_LENGTH,
} from "../subject";
import type { SubjectInputErrors } from "../subject";
import { GoalPicker } from "./goal-picker";

const nameMessages: Record<NonNullable<SubjectInputErrors["name"]>, string> = {
  required: "Informe o nome da disciplina.",
  "too-long": `O nome deve ter no máximo ${SUBJECT_NAME_MAX_LENGTH} caracteres.`,
};

const descriptionMessages: Record<
  NonNullable<SubjectInputErrors["description"]>,
  string
> = {
  "too-long": `A descrição deve ter no máximo ${SUBJECT_DESCRIPTION_MAX_LENGTH} caracteres.`,
};

/** Creation form; expects at least one goal to choose from. */
export function SubjectForm({ goals }: { goals: Goal[] }) {
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const firstGoalRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<SubjectInputErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<"created" | "failed" | null>(null);

  // A goal deleted while the form is open leaves the list of choices.
  const availableIds = goalIds.filter((id) =>
    goals.some((goal) => goal.id === id),
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setOutcome(null);
    setSubmitting(true);

    try {
      const result = await createSubject({
        name,
        description,
        goalIds: availableIds,
      });

      if (!result.ok) {
        setErrors(result.errors);
        const target = result.errors.name
          ? nameRef
          : result.errors.description
            ? descriptionRef
            : firstGoalRef;
        target.current?.focus();
        return;
      }

      setErrors({});
      setName("");
      setDescription("");
      setGoalIds([]);
      setOutcome("created");
      nameRef.current?.focus();
    } catch {
      setErrors({});
      setOutcome("failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <NameDescriptionFields
        name={name}
        description={description}
        nameError={errors.name && nameMessages[errors.name]}
        descriptionError={
          errors.description && descriptionMessages[errors.description]
        }
        onNameChange={setName}
        onDescriptionChange={setDescription}
        nameRef={nameRef}
        descriptionRef={descriptionRef}
      />

      <GoalPicker
        goals={goals}
        selectedIds={availableIds}
        onChange={setGoalIds}
        error={errors.goalIds}
        firstCheckboxRef={firstGoalRef}
      />

      <Button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-full text-base font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_18%)] focus-visible:ring-ring"
      >
        Criar disciplina
      </Button>

      <p role="status" className="min-h-5 text-sm font-medium">
        {outcome === "created" && "Disciplina criada."}
      </p>
      {outcome === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar a disciplina. Tente novamente.
        </p>
      )}
    </form>
  );
}
