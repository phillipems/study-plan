import { useId, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createGoal } from "../create-goal";
import { GOAL_DESCRIPTION_MAX_LENGTH, GOAL_NAME_MAX_LENGTH } from "../goal";
import type { GoalInputErrors } from "../goal";

const nameMessages = {
  required: "Informe o nome do objetivo.",
  "too-long": `O nome deve ter no máximo ${GOAL_NAME_MAX_LENGTH} caracteres.`,
};

const descriptionMessages = {
  "too-long": `A descrição deve ter no máximo ${GOAL_DESCRIPTION_MAX_LENGTH} caracteres.`,
};

export function GoalForm() {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<GoalInputErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<"created" | "failed" | null>(null);

  const nameErrorId = `${id}-name-error`;
  const descriptionErrorId = `${id}-description-error`;

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          ref={nameRef}
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? descriptionErrorId : undefined}
        />
        {errors.description && (
          <p id={descriptionErrorId} className="text-sm text-destructive">
            {descriptionMessages[errors.description]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        Criar objetivo
      </Button>

      <p role="status" className="text-sm">
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
