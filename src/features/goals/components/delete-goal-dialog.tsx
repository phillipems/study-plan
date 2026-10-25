import { useRef, useState } from "react";
import type { RefObject } from "react";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { Goal } from "../goal";
import { deleteGoal } from "../goal-repository";

type DeleteGoalDialogProps = {
  /** The goal to delete; the dialog is closed when null. */
  goal: Goal | null;
  onClose: () => void;
  onDeleted: () => void;
  /** Receives focus when the dialog is cancelled. */
  returnFocusRef: RefObject<HTMLElement | null>;
  /** Receives focus after a deletion, since the card and its menu are gone. */
  focusAfterDeleteRef: RefObject<HTMLElement | null>;
};

export function DeleteGoalDialog({
  goal,
  onClose,
  onDeleted,
  returnFocusRef,
  focusAfterDeleteRef,
}: DeleteGoalDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const deletedRef = useRef(false);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFailed(false);
      onClose();
    }
  }

  // A plain button instead of AlertDialogAction: the dialog must stay open
  // until the deletion is confirmed, so a failure can be reported in it.
  async function handleDelete(target: Goal) {
    setFailed(false);
    setDeleting(true);
    try {
      await deleteGoal(target.id);
      deletedRef.current = true;
      onDeleted();
    } catch {
      setFailed(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={goal !== null} onOpenChange={handleOpenChange}>
      {goal && (
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (deletedRef.current
              ? focusAfterDeleteRef
              : returnFocusRef
            ).current?.focus();
            deletedRef.current = false;
          }}
          className="gap-6 rounded-3xl border-2 border-foreground p-6 ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md sm:p-8"
        >
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-display text-3xl uppercase">
              Excluir objetivo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              O objetivo{" "}
              <strong className="font-semibold wrap-anywhere text-foreground">
                {goal.name}
              </strong>{" "}
              será excluído definitivamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {failed && (
            <p role="alert" className="text-sm text-destructive">
              Não foi possível excluir o objetivo. Tente novamente.
            </p>
          )}

          <AlertDialogFooter className="m-0 flex-col-reverse gap-3 border-t-0 bg-transparent p-0 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="h-12 rounded-full border-2 border-foreground px-6 text-base font-semibold focus-visible:ring-ring">
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={deleting}
              onClick={() => handleDelete(goal)}
              className="h-12 rounded-full bg-destructive px-6 text-base font-semibold text-paper hover:bg-destructive/90 focus-visible:ring-ring"
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
