import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { listGoals } from "@/features/goals";
import { Button } from "@/shared/ui/button";
import { listSubjects } from "../subject-repository";
import { SubjectForm } from "./subject-form";
import { SubjectList } from "./subject-list";
import type { SubjectListState } from "./subject-list";

export function SubjectsPage() {
  // Runs again whenever subjects or goals change.
  const state = useLiveQuery(async (): Promise<SubjectListState> => {
    try {
      const [subjects, goals] = await Promise.all([
        listSubjects(),
        listGoals(),
      ]);
      return { status: "loaded", subjects, goals };
    } catch {
      return { status: "failed" };
    }
  }) ?? { status: "loading" };

  return (
    <div className="space-y-10 sm:space-y-14">
      <header className="space-y-4">
        <p className="text-eyebrow text-muted-foreground">Planejamento</p>
        <h1 className="text-display text-page uppercase">Disciplinas</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Organize o conteúdo que você vai estudar e ligue cada disciplina aos
          seus objetivos.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <section
          aria-labelledby="new-subject-heading"
          className="surface-ink min-w-0 space-y-6 rounded-3xl p-6 sm:p-8 lg:sticky lg:top-24"
        >
          <h2
            id="new-subject-heading"
            className="text-display text-3xl uppercase"
          >
            Nova disciplina
          </h2>
          <NewSubjectPanel state={state} />
        </section>

        <section
          aria-labelledby="subject-list-heading"
          className="min-w-0 space-y-6"
        >
          <h2
            id="subject-list-heading"
            className="text-display text-3xl uppercase"
          >
            Suas disciplinas
          </h2>
          <SubjectList state={state} />
        </section>
      </div>
    </div>
  );
}

function NewSubjectPanel({ state }: { state: SubjectListState }) {
  if (state.status === "loading") {
    return <p className="text-muted-foreground">Carregando objetivos…</p>;
  }

  if (state.status === "failed") {
    return (
      <p className="text-muted-foreground">
        Não foi possível carregar os objetivos para criar uma disciplina.
      </p>
    );
  }

  if (state.goals.length === 0) {
    return (
      <div className="space-y-5">
        <p className="text-muted-foreground">
          Cadastre um objetivo antes de criar uma disciplina. Cada disciplina
          precisa estar ligada a pelo menos um objetivo.
        </p>
        <Button
          asChild
          className="h-12 w-full rounded-full text-base font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_18%)] focus-visible:ring-ring"
        >
          <Link to="/goals">Ir para Objetivos</Link>
        </Button>
      </div>
    );
  }

  return <SubjectForm goals={state.goals} />;
}
