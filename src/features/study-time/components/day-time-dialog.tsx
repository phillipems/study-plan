import { useId, useRef, useState } from "react";
import type { RefObject, SubmitEvent } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { formatLongDate } from "../calendar";
import { splitDuration } from "../duration";
import { saveDailyStudyTime } from "../save-daily-study-time";
import type { SaveDailyStudyTimeErrors } from "../save-daily-study-time";
import { deleteDailyStudyTime } from "../study-time-repository";

const hoursMessages = {
  required: "Informe as horas (use 0 se não houver).",
  invalid: "Use apenas números inteiros nas horas.",
  "too-large": "As horas vão de 0 a 23.",
};

const minutesMessages = {
  required: "Informe os minutos (use 0 se não houver).",
  invalid: "Use apenas números inteiros nos minutos.",
  "too-large": "Os minutos vão de 0 a 59.",
};

const fieldClass =
  "h-11 border-transparent bg-paper text-base text-ink tabular-nums focus-visible:border-primary focus-visible:ring-primary md:text-base";

type DayTimeDialogProps = {
  subjectId: string;
  /** The day being edited; the dialog is closed when null. */
  date: string | null;
  /** Current total of that day, if any. */
  currentMinutes?: number;
  onClose: () => void;
  onSaved: () => void;
  onRemoved: () => void;
  /** Receives focus when the dialog closes. */
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function DayTimeDialog({
  subjectId,
  date,
  currentMinutes,
  onClose,
  onSaved,
  onRemoved,
  returnFocusRef,
}: DayTimeDialogProps) {
  return (
    <Dialog open={date !== null} onOpenChange={(open) => !open && onClose()}>
      {date && (
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
          className="surface-ink gap-6 rounded-3xl bg-background p-6 text-foreground ring-0 sm:max-w-md sm:p-8"
        >
          {/* Keyed by day, so each opening starts from the stored total. */}
          <DayTimeForm
            key={date}
            subjectId={subjectId}
            date={date}
            currentMinutes={currentMinutes}
            onCancel={onClose}
            onSaved={onSaved}
            onRemoved={onRemoved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

type DayTimeFormProps = {
  subjectId: string;
  date: string;
  currentMinutes?: number;
  onCancel: () => void;
  onSaved: () => void;
  onRemoved: () => void;
};

function DayTimeForm({
  subjectId,
  date,
  currentMinutes,
  onCancel,
  onSaved,
  onRemoved,
}: DayTimeFormProps) {
  const id = useId();
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const initial =
    currentMinutes === undefined
      ? { hours: "", minutes: "" }
      : splitDuration(currentMinutes);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [errors, setErrors] = useState<SaveDailyStudyTimeErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const hasTotal = currentMinutes !== undefined;
  const hoursErrorId = `${id}-hours-error`;
  const minutesErrorId = `${id}-minutes-error`;
  const formErrorId = `${id}-form-error`;
  const hintId = `${id}-hint`;

  const formError = errors.total
    ? hasTotal
      ? "Informe um tempo maior que 00:00. Para apagar o registro, use Remover registro."
      : "Informe um tempo maior que 00:00."
    : errors.subject
      ? "Esta disciplina não existe mais."
      : errors.date
        ? "Não é possível registrar tempo em uma data futura."
        : undefined;

  function describedBy(fieldErrorId: string, hasFieldError: boolean) {
    return [hintId, hasFieldError && fieldErrorId, formError && formErrorId]
      .filter(Boolean)
      .join(" ");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);
    setSubmitting(true);

    try {
      const result = await saveDailyStudyTime(subjectId, date, {
        hours,
        minutes,
      });

      if (!result.ok) {
        setErrors(result.errors);
        (result.errors.minutes && !result.errors.hours
          ? minutesRef
          : hoursRef
        ).current?.focus();
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
          Tempo de estudo
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Total estudado em {formatLongDate(date)}.
        </DialogDescription>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${id}-hours`}>Horas</Label>
          <Input
            ref={hoursRef}
            id={`${id}-hours`}
            value={hours}
            inputMode="numeric"
            autoComplete="off"
            onChange={(event) => setHours(event.target.value)}
            aria-required="true"
            aria-invalid={errors.hours || errors.total ? true : undefined}
            aria-describedby={describedBy(hoursErrorId, !!errors.hours)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-minutes`}>Minutos</Label>
          <Input
            ref={minutesRef}
            id={`${id}-minutes`}
            value={minutes}
            inputMode="numeric"
            autoComplete="off"
            onChange={(event) => setMinutes(event.target.value)}
            aria-required="true"
            aria-invalid={errors.minutes || errors.total ? true : undefined}
            aria-describedby={describedBy(minutesErrorId, !!errors.minutes)}
            className={fieldClass}
          />
        </div>
      </div>

      <p id={hintId} className="text-sm text-muted-foreground">
        Duração total do dia, de 00:01 a 23:59. Não é o horário do relógio.
      </p>

      {errors.hours && (
        <p id={hoursErrorId} className="text-sm text-destructive">
          {hoursMessages[errors.hours]}
        </p>
      )}
      {errors.minutes && (
        <p id={minutesErrorId} className="text-sm text-destructive">
          {minutesMessages[errors.minutes]}
        </p>
      )}
      {formError && (
        <p id={formErrorId} className="text-sm text-destructive">
          {formError}
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível salvar o tempo. Tente novamente.
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
          Salvar
        </Button>
      </div>

      {hasTotal && (
        <div className="border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmingRemoval(true)}
            className="h-10 rounded-full px-4 text-sm font-semibold text-destructive hover:bg-secondary hover:text-destructive focus-visible:ring-ring"
          >
            Remover registro
          </Button>
          <RemoveConfirmation
            open={confirmingRemoval}
            subjectId={subjectId}
            date={date}
            onCancel={() => setConfirmingRemoval(false)}
            onRemoved={onRemoved}
          />
        </div>
      )}
    </form>
  );
}

type RemoveConfirmationProps = {
  open: boolean;
  subjectId: string;
  date: string;
  onCancel: () => void;
  onRemoved: () => void;
};

function RemoveConfirmation({
  open,
  subjectId,
  date,
  onCancel,
  onRemoved,
}: RemoveConfirmationProps) {
  const [removing, setRemoving] = useState(false);
  const [failed, setFailed] = useState(false);
  const removedRef = useRef(false);

  // A plain button instead of AlertDialogAction: the dialog must stay open
  // until the removal is confirmed, so a failure can be reported in it.
  async function handleRemove() {
    setFailed(false);
    setRemoving(true);
    try {
      await deleteDailyStudyTime(subjectId, date);
      removedRef.current = true;
      onRemoved();
    } catch {
      setFailed(true);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFailed(false);
          onCancel();
        }
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          // After a removal the day dialog closes too and handles focus.
          if (removedRef.current) event.preventDefault();
        }}
        className="gap-6 rounded-3xl border-2 border-foreground p-6 ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md sm:p-8"
      >
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-display text-3xl uppercase">
            Remover registro?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            O tempo de {formatLongDate(date)} será removido, e o dia voltará a
            ficar sem registro.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {failed && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível remover o registro. Tente novamente.
          </p>
        )}

        <AlertDialogFooter className="m-0 flex-col-reverse gap-3 border-t-0 bg-transparent p-0 sm:flex-row sm:justify-end">
          <AlertDialogCancel className="h-12 rounded-full border-2 border-foreground px-6 text-base font-semibold focus-visible:ring-ring">
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={removing}
            onClick={handleRemove}
            className="h-12 rounded-full bg-destructive px-6 text-base font-semibold text-paper hover:bg-destructive/90 focus-visible:ring-ring"
          >
            Remover
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
