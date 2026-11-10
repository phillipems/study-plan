import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeftIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { getSubject } from "@/features/subjects";
import type { Subject } from "@/features/subjects";
import {
  addWeeks,
  resolveWeek,
  startOfWeek,
  toDateKey,
  weekDays,
} from "../calendar";
import { listWeek } from "../study-time-repository";
import { DayTimeDialog } from "./day-time-dialog";
import { WeekDays } from "./week-days";
import { WeekNavigator } from "./week-navigator";

type SubjectState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; subject: Subject | undefined };

type WeekState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; totals: Map<string, number> };

const backLinkClass =
  "inline-flex items-center gap-2 rounded-md text-sm font-medium outline-offset-2 outline-foreground hover:underline focus-visible:outline-2";

export function SubjectStudyTimePage() {
  const { subjectId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = toDateKey(new Date());
  // Missing, invalid and future weeks all resolve to the current week.
  const monday = resolveWeek(searchParams.get("week"), today);
  const isCurrentWeek = monday === startOfWeek(today);

  const subjectState =
    useLiveQuery(async (): Promise<SubjectState> => {
      try {
        return { status: "loaded", subject: await getSubject(subjectId) };
      } catch {
        return { status: "failed" };
      }
    }, [subjectId]) ?? ({ status: "loading" } as SubjectState);

  const weekResult = useLiveQuery(async () => {
    try {
      const entries = await listWeek(subjectId, monday);
      return {
        subjectId,
        monday,
        state: {
          status: "loaded",
          totals: new Map(entries.map((e) => [e.date, e.durationMinutes])),
        } as WeekState,
      };
    } catch {
      return { subjectId, monday, state: { status: "failed" } as WeekState };
    }
  }, [subjectId, monday]);
  // While another week loads, the previous result must not be shown under it.
  const weekState: WeekState =
    weekResult?.subjectId === subjectId && weekResult.monday === monday
      ? weekResult.state
      : { status: "loading" };

  if (subjectState.status === "loading") {
    return <p className="text-muted-foreground">Carregando disciplina…</p>;
  }

  if (subjectState.status === "failed" || !subjectState.subject) {
    return (
      <section className="space-y-6">
        <p className="text-eyebrow text-muted-foreground">Disciplina</p>
        <h1 className="text-display text-page uppercase">
          {subjectState.status === "failed"
            ? "Algo deu errado"
            : "Disciplina não encontrada"}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {subjectState.status === "failed"
            ? "Não foi possível carregar a disciplina."
            : "Esta disciplina não existe ou foi removida."}
        </p>
        <Link to="/subjects" className={backLinkClass}>
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Voltar para Disciplinas
        </Link>
      </section>
    );
  }

  return (
    <SubjectStudyTime
      subject={subjectState.subject}
      monday={monday}
      today={today}
      isCurrentWeek={isCurrentWeek}
      weekState={weekState}
      onWeekChange={(weeks) =>
        setSearchParams({ week: addWeeks(monday, weeks) }, { replace: true })
      }
    />
  );
}

type SubjectStudyTimeProps = {
  subject: Subject;
  monday: string;
  today: string;
  isCurrentWeek: boolean;
  weekState: WeekState;
  onWeekChange: (weeks: number) => void;
};

function SubjectStudyTime({
  subject,
  monday,
  today,
  isCurrentWeek,
  weekState,
  onWeekChange,
}: SubjectStudyTimeProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"saved" | "removed" | null>(null);
  // The day button that opened the dialog receives focus when it closes.
  const dayButtonRef = useRef<HTMLElement | null>(null);

  const totals =
    weekState.status === "loaded"
      ? weekState.totals
      : new Map<string, number>();

  return (
    <div className="space-y-10 sm:space-y-14">
      <header className="space-y-4">
        <Link to="/subjects" className={backLinkClass}>
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Disciplinas
        </Link>
        <p className="text-eyebrow text-muted-foreground">Disciplina</p>
        <h1 className="text-display text-page wrap-break-word">
          {subject.name}
        </h1>
        {subject.description && (
          <p className="max-w-xl text-lg wrap-break-word whitespace-pre-line text-muted-foreground">
            {subject.description}
          </p>
        )}
      </header>

      <section aria-labelledby="study-time-heading" className="space-y-6">
        <h2 id="study-time-heading" className="text-display text-3xl uppercase">
          Tempo de estudo
        </h2>

        <WeekNavigator
          monday={monday}
          isCurrentWeek={isCurrentWeek}
          onPrevious={() => {
            setFeedback(null);
            onWeekChange(-1);
          }}
          onNext={() => {
            setFeedback(null);
            onWeekChange(1);
          }}
        />

        <p aria-live="polite" className="min-h-5 text-sm font-medium">
          {feedback === "saved" && "Tempo salvo."}
          {feedback === "removed" && "Registro removido."}
        </p>

        {weekState.status === "failed" ? (
          <div
            role="alert"
            className="space-y-2 rounded-2xl border-2 border-destructive bg-card p-6"
          >
            <p className="text-display text-2xl text-destructive uppercase">
              Algo deu errado
            </p>
            <p>Não foi possível carregar o tempo desta semana.</p>
          </div>
        ) : (
          <div aria-busy={weekState.status === "loading"}>
            <WeekDays
              days={weekDays(monday)}
              totals={totals}
              today={today}
              onEdit={(date, button) => {
                dayButtonRef.current = button;
                setFeedback(null);
                setEditingDate(date);
              }}
            />
          </div>
        )}
      </section>

      <DayTimeDialog
        subjectId={subject.id}
        date={editingDate}
        currentMinutes={editingDate ? totals.get(editingDate) : undefined}
        onClose={() => setEditingDate(null)}
        onSaved={() => {
          setEditingDate(null);
          setFeedback("saved");
        }}
        onRemoved={() => {
          setEditingDate(null);
          setFeedback("removed");
        }}
        returnFocusRef={dayButtonRef}
      />
    </div>
  );
}
