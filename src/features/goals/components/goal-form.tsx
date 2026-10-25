import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/shared/ui/button";
import { createGoal } from "../create-goal";
import type { GoalInputErrors } from "../goal";
import { GoalFields } from "./goal-fields";

export function GoalForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<GoalInputErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<"created" | "failed" | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setOutcome(null);
    setSubmitting(true);

    try {
      const result = await createGoal({ name, description });

      if (!result.ok) {
        setErrors(result.errors);
        (result.errors.name ? nameRef : descriptionRef).current?.focus();
        return;
      }

      setErrors({});
      setName("");
      setDescription("");
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
      <GoalFields
        name={name}
        description={description}
        errors={errors}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        nameRef={nameRef}
        descriptionRef={descriptionRef}
      />

      <Button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-full text-base font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_18%)] focus-visible:ring-ring"
      >
        Criar objetivo
      </Button>

      <p role="status" className="min-h-5 text-sm font-medium">
        {outcome === "created" && "Objetivo criado."}
      </p>
      {outcome === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar o objetivo. Tente novamente.
        </p>
      )}
    </form>
  );
}
