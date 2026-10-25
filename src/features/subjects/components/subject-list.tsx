import type { Goal } from "@/features/goals";
import type { Subject } from "../subject";

export type SubjectListState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; subjects: Subject[]; goals: Goal[] };

export function SubjectList({ state }: { state: SubjectListState }) {
  if (state.status === "loading") {
    return (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2">
        <p className="sr-only">Carregando disciplinas…</p>
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
        <p>Não foi possível carregar as disciplinas.</p>
      </div>
    );
  }

  if (state.subjects.length === 0) {
    return (
      <div className="space-y-2 rounded-2xl border-2 border-dashed border-foreground/35 p-6 sm:p-8">
        <p className="text-display text-3xl uppercase">
          Nenhuma disciplina ainda
        </p>
        <p className="text-muted-foreground">
          Você ainda não tem disciplinas. Crie a primeira para começar.
        </p>
      </div>
    );
  }

  const goalNames = new Map(state.goals.map((goal) => [goal.id, goal.name]));

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {state.subjects.map((subject) => {
        // Links to goals deleted since then are not shown.
        const linkedGoals = subject.goalIds.flatMap((id) => {
          const name = goalNames.get(id);
          return name === undefined ? [] : [{ id, name }];
        });

        return (
          <li
            key={subject.id}
            className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-5"
          >
            <p className="text-display text-2xl wrap-break-word">
              {subject.name}
            </p>
            {subject.description && (
              <p className="text-sm wrap-break-word whitespace-pre-line text-muted-foreground">
                {subject.description}
              </p>
            )}
            {linkedGoals.length > 0 ? (
              <ul
                aria-label="Objetivos vinculados"
                className="flex flex-wrap gap-2 pt-1"
              >
                {linkedGoals.map((goal) => (
                  <li
                    key={goal.id}
                    className="max-w-full rounded-full border border-foreground/30 px-2.5 py-0.5 text-xs font-medium wrap-anywhere"
                  >
                    {goal.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum objetivo vinculado disponível.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
