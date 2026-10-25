import { useId } from "react";
import type { Ref } from "react";
import type { Goal } from "@/features/goals";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import type { SubjectInputErrors } from "../subject";

const errorMessages = {
  required: "Selecione ao menos um objetivo.",
  "not-found":
    "Um dos objetivos selecionados não existe mais. Revise a seleção.",
};

function selectedLabel(count: number) {
  if (count === 0) return "Nenhum objetivo selecionado";
  return count === 1
    ? "1 objetivo selecionado"
    : `${count} objetivos selecionados`;
}

type GoalPickerProps = {
  goals: Goal[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  error?: SubjectInputErrors["goalIds"];
  /** Attached to the first checkbox, to move focus here on a validation error. */
  firstCheckboxRef: Ref<HTMLButtonElement>;
};

/** Multiple choice of existing goals, as a group of checkboxes. */
export function GoalPicker({
  goals,
  selectedIds,
  onChange,
  error,
  firstCheckboxRef,
}: GoalPickerProps) {
  const id = useId();
  const countId = `${id}-count`;
  const errorId = `${id}-error`;

  function toggle(goalId: string, checked: boolean) {
    onChange(
      checked
        ? [...selectedIds, goalId]
        : selectedIds.filter((selectedId) => selectedId !== goalId),
    );
  }

  return (
    <fieldset
      className="space-y-2"
      aria-describedby={error ? `${countId} ${errorId}` : countId}
    >
      <legend className="text-sm font-medium">Objetivos vinculados</legend>
      <p id={countId} className="text-sm text-muted-foreground">
        {selectedLabel(selectedIds.length)}
      </p>
      <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-1.5">
        {goals.map((goal, index) => (
          <li
            key={goal.id}
            className="flex items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-secondary"
          >
            <Checkbox
              ref={index === 0 ? firstCheckboxRef : undefined}
              id={`${id}-${goal.id}`}
              checked={selectedIds.includes(goal.id)}
              onCheckedChange={(checked) => toggle(goal.id, checked === true)}
              aria-invalid={error ? true : undefined}
              className="mt-0.5 size-5 border-foreground/60 focus-visible:border-primary focus-visible:ring-primary"
            />
            <Label
              htmlFor={`${id}-${goal.id}`}
              className="text-sm leading-snug font-normal wrap-anywhere"
            >
              {goal.name}
            </Label>
          </li>
        ))}
      </ul>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {errorMessages[error]}
        </p>
      )}
    </fieldset>
  );
}
