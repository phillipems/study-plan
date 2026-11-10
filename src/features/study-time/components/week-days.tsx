import type { MouseEvent } from "react";
import { Button } from "@/shared/ui/button";
import { formatDay, formatLongDate, isFutureDate } from "../calendar";
import { formatDuration } from "../duration";

type WeekDaysProps = {
  days: string[];
  /** Total minutes by date; dates without a total are missing. */
  totals: Map<string, number>;
  today: string;
  onEdit: (date: string, button: HTMLButtonElement) => void;
};

function cardClass(isToday: boolean, isFuture: boolean) {
  if (isToday) return "border-foreground bg-card";
  // Days that have not come yet stay visible, but look unavailable.
  if (isFuture) return "border-dashed border-foreground/25 bg-transparent";
  return "border-foreground/20 bg-card";
}

export function WeekDays({ days, totals, today, onEdit }: WeekDaysProps) {
  return (
    <ol className="grid gap-3 lg:grid-cols-7">
      {days.map((date) => {
        const { weekday, date: dayMonth } = formatDay(date);
        const total = totals.get(date);
        const isToday = date === today;
        const isFuture = isFutureDate(date, today);
        const longDate = formatLongDate(date);
        const action = total === undefined ? "Registrar" : "Editar";

        return (
          <li
            key={date}
            aria-current={isToday ? "date" : undefined}
            // Small screens: one row per day, button on the right.
            // From lg: seven columns, button at the bottom of each card.
            className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 lg:flex-col lg:items-stretch ${cardClass(
              isToday,
              isFuture,
            )}`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-display text-xl whitespace-nowrap ${
                    isFuture ? "text-muted-foreground" : ""
                  }`}
                >
                  {weekday}{" "}
                  <span className="text-muted-foreground lg:block">
                    {dayMonth}
                  </span>
                </p>
                {isToday && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground lg:absolute lg:top-3 lg:right-3">
                    Hoje
                  </span>
                )}
              </div>
              <p>
                {isFuture ? (
                  <span className="text-sm text-muted-foreground">
                    Data futura
                  </span>
                ) : total === undefined ? (
                  <span className="text-sm text-muted-foreground">
                    Sem registro
                  </span>
                ) : (
                  <span className="text-display text-2xl">
                    {formatDuration(total)}
                  </span>
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isFuture}
              aria-label={
                isFuture
                  ? `Registro indisponível para ${longDate}, data futura`
                  : `${action} tempo de ${longDate}`
              }
              onClick={(event: MouseEvent<HTMLButtonElement>) =>
                onEdit(date, event.currentTarget)
              }
              className="h-10 shrink-0 rounded-full border-2 border-foreground bg-transparent px-4 text-sm font-semibold hover:bg-secondary focus-visible:ring-ring disabled:border-foreground/25 lg:w-full"
            >
              {isFuture ? "Indisponível" : action}
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
