import { useLiveQuery } from "dexie-react-hooks";
import { listGoals } from "../goal-repository";
import { GoalForm } from "./goal-form";
import { GoalList } from "./goal-list";
import type { GoalListState } from "./goal-list";

export function GoalsPage() {
  // Runs again whenever the goals table changes, so a saved goal shows up at once.
  const state = useLiveQuery(async (): Promise<GoalListState> => {
    try {
      return { status: "loaded", goals: await listGoals() };
    } catch {
      return { status: "failed" };
    }
  });

  return (
    <div className="space-y-10 sm:space-y-14">
      <header className="space-y-4">
        <p className="text-eyebrow text-muted-foreground">Planejamento</p>
        <h1 className="text-display text-page uppercase">Objetivos</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Defina o que você quer aprender e mantenha tudo à vista.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <section
          aria-labelledby="new-goal-heading"
          className="surface-ink min-w-0 space-y-6 rounded-3xl p-6 sm:p-8 lg:sticky lg:top-24"
        >
          <h2 id="new-goal-heading" className="text-display text-3xl uppercase">
            Novo objetivo
          </h2>
          <GoalForm />
        </section>

        <section
          aria-labelledby="goal-list-heading"
          className="min-w-0 space-y-6"
        >
          <h2
            id="goal-list-heading"
            className="text-display text-3xl uppercase"
          >
            Seus objetivos
          </h2>
          <GoalList state={state ?? { status: "loading" }} />
        </section>
      </div>
    </div>
  );
}
