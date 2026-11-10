import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatWeekRange } from "../calendar";

type WeekNavigatorProps = {
  monday: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

const arrowClass =
  "size-11 shrink-0 rounded-full border-2 border-foreground bg-transparent hover:bg-secondary focus-visible:ring-ring disabled:border-foreground/25";

export function WeekNavigator({
  monday,
  isCurrentWeek,
  onPrevious,
  onNext,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Semana anterior"
        onClick={onPrevious}
        className={arrowClass}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
      </Button>

      {/* Announced when the week changes. */}
      <p aria-live="polite" className="text-center">
        <span className="block text-display text-xl sm:text-2xl">
          {formatWeekRange(monday)}
        </span>
        <span className="block min-h-4 text-eyebrow text-muted-foreground">
          {isCurrentWeek && "Semana atual"}
        </span>
      </p>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Próxima semana"
        onClick={onNext}
        disabled={isCurrentWeek}
        className={arrowClass}
      >
        <ChevronRightIcon aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}
