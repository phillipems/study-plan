import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { Goal } from "../goal";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { EditGoalDialog } from "./edit-goal-dialog";
import { GoalActionsMenu } from "./goal-actions-menu";

export type GoalListState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; goals: Goal[] };

type GoalListProps = {
  state: GoalListState;
  /** Receives focus after a deletion, since the deleted card is gone. */
  headingRef: RefObject<HTMLElement | null>;
};

const feedbackMessages = {
  updated: "Objetivo atualizado.",
  deleted: "Objetivo excluído.",
};

export function GoalList({ state, headingRef }: GoalListProps) {
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [feedback, setFeedback] = useState<"updated" | "deleted" | null>(null);
  // The dialogs open from a menu item that no longer exists when they close,
  // so focus is handed back to the actions button of the card explicitly.
  const actionsButtonRef = useRef<HTMLElement | null>(null);

  function startEditing(goal: Goal, actionsButton: HTMLElement | null) {
    actionsButtonRef.current = actionsButton;
    setFeedback(null);
    setEditing(goal);
  }

  function startDeleting(goal: Goal, actionsButton: HTMLElement | null) {
    actionsButtonRef.current = actionsButton;
    setFeedback(null);
    setDeleting(goal);
  }

  return (
    <>
      {/* Not role="status": the creation form already owns that region. */}
      <p aria-live="polite" className="-mt-3 min-h-5 text-sm font-medium">
        {feedback && feedbackMessages[feedback]}
      </p>

      <GoalListContent
        state={state}
        onEdit={startEditing}
        onDelete={startDeleting}
      />

      <EditGoalDialog
        goal={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setFeedback("updated");
        }}
        returnFocusRef={actionsButtonRef}
      />
      <DeleteGoalDialog
        goal={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          setFeedback("deleted");
        }}
        returnFocusRef={actionsButtonRef}
        focusAfterDeleteRef={headingRef}
      />
    </>
  );
}

type GoalListContentProps = {
  state: GoalListState;
  onEdit: (goal: Goal, actionsButton: HTMLElement | null) => void;
  onDelete: (goal: Goal, actionsButton: HTMLElement | null) => void;
};

function GoalListContent({ state, onEdit, onDelete }: GoalListContentProps) {
  if (state.status === "loading") {
    return (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2">
        <p className="sr-only">Carregando objetivos…</p>
        <div className="h-32 rounded-2xl bg-muted motion-safe:animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted motion-safe:animate-pulse" />
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div
        role="alert"
        className="space-y-2 rounded-2xl border-2 border-destructive bg-card p-6"
      >
        <p className="text-display text-2xl text-destructive uppercase">
          Algo deu errado
        </p>
        <p>Não foi possível carregar os objetivos.</p>
      </div>
    );
  }

  if (state.goals.length === 0) {
    return (
      <div className="space-y-2 rounded-2xl border-2 border-dashed border-foreground/35 p-6 sm:p-8">
        <p className="text-display text-3xl uppercase">Nada por aqui ainda</p>
        <p className="text-muted-foreground">
          Você ainda não tem objetivos. Crie o primeiro para começar.
        </p>
      </div>
    );
  }

  return (
    // The number on each card is decorative: a CSS counter that runs backwards,
    // so the oldest goal is 01 and existing cards keep their number.
    <ul
      className="grid gap-4 sm:grid-cols-2"
      style={{ counterReset: `goal ${state.goals.length + 1}` }}
    >
      {state.goals.map((goal) => (
        <li
          key={goal.id}
          className="relative flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-5 [counter-increment:goal_-1] before:w-fit before:rounded-full before:bg-foreground before:px-2.5 before:py-0.5 before:text-xs before:font-semibold before:text-background before:content-[counter(goal,decimal-leading-zero)]"
        >
          <div className="absolute top-3 right-3">
            <GoalActionsMenu
              goalName={goal.name}
              onEdit={(actionsButton) => onEdit(goal, actionsButton)}
              onDelete={(actionsButton) => onDelete(goal, actionsButton)}
            />
          </div>
          <p className="text-display text-2xl wrap-break-word">{goal.name}</p>
          {goal.description && (
            <p className="text-sm wrap-break-word whitespace-pre-line text-muted-foreground">
              {goal.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
