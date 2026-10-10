import type { Goal } from "../goal";

export type GoalListState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; goals: Goal[] };

export function GoalList({ state }: { state: GoalListState }) {
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
          className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-5 [counter-increment:goal_-1] before:w-fit before:rounded-full before:bg-foreground before:px-2.5 before:py-0.5 before:text-xs before:font-semibold before:text-background before:content-[counter(goal,decimal-leading-zero)]"
        >
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
