import type { Goal } from "../goal";

export type GoalListState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; goals: Goal[] };

export function GoalList({ state }: { state: GoalListState }) {
  if (state.status === "loading") {
    return <p className="text-muted-foreground">Carregando objetivos…</p>;
  }

  if (state.status === "failed") {
    return (
      <p role="alert" className="text-destructive">
        Não foi possível carregar os objetivos.
      </p>
    );
  }

  if (state.goals.length === 0) {
    return (
      <p className="text-muted-foreground">
        Você ainda não tem objetivos. Crie o primeiro acima.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {state.goals.map((goal) => (
        <li key={goal.id} className="space-y-1 rounded-lg border p-4">
          <p className="font-medium wrap-break-word">{goal.name}</p>
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
