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
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-semibold">Objetivos</h1>

      <section aria-labelledby="new-goal-heading" className="space-y-4">
        <h2 id="new-goal-heading" className="text-lg font-medium">
          Novo objetivo
        </h2>
        <GoalForm />
      </section>

      <section aria-labelledby="goal-list-heading" className="space-y-4">
        <h2 id="goal-list-heading" className="text-lg font-medium">
          Seus objetivos
        </h2>
        <GoalList state={state ?? { status: "loading" }} />
      </section>
    </div>
  );
}
