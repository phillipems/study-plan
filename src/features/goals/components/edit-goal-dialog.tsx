import { useRef, useState } from "react";
import type { RefObject, SubmitEvent } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { editGoal } from "../edit-goal";
import type { Goal, GoalInputErrors } from "../goal";
import { GoalFields } from "./goal-fields";

type EditGoalDialogProps = {
  /** The goal being edited; the dialog is closed when null. */
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
  /** Receives focus when the dialog closes. */
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function EditGoalDialog({
  goal,
  onClose,
  onSaved,
  returnFocusRef,
}: EditGoalDialogProps) {
  return (
    <Dialog open={goal !== null} onOpenChange={(open) => !open && onClose()}>
      {goal && (
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
          className="surface-ink gap-6 rounded-3xl bg-background p-6 text-foreground ring-0 sm:max-w-lg sm:p-8"
        >
          {/* Keyed by goal, so each opening starts from the stored values. */}
          <EditGoalForm
            key={goal.id}
            goal={goal}
            onCancel={onClose}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

type EditGoalFormProps = {
  goal: Goal;
  onCancel: () => void;
  onSaved: () => void;
};

function EditGoalForm({ goal, onCancel, onSaved }: EditGoalFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(goal.name);
  const [description, setDescription] = useState(goal.description ?? "");
  const [errors, setErrors] = useState<GoalInputErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);
    setSubmitting(true);

    try {
      const result = await editGoal(goal.id, { name, description });

      if (!result.ok) {
        setErrors(result.errors);
        (result.errors.name ? nameRef : descriptionRef).current?.focus();
        return;
      }

      onSaved();
    } catch {
      setErrors({});
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <DialogTitle className="text-display text-3xl uppercase">
          Editar objetivo
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Altere o nome ou a descrição e salve.
        </DialogDescription>
      </div>

      <GoalFields
        name={name}
        description={description}
        errors={errors}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        nameRef={nameRef}
        descriptionRef={descriptionRef}
      />

      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar as alterações. Tente novamente.
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-12 rounded-full border-2 border-foreground/40 bg-transparent px-6 text-base font-semibold hover:bg-secondary focus-visible:ring-ring"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-full px-6 text-base font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_18%)] focus-visible:ring-ring"
        >
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
