import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { listWeek, putDailyStudyTime } from "../study-time-repository";
import { SubjectStudyTimePage } from "./subject-study-time-page";

// Keeps the real repository, but lets a test force a persistence failure.
vi.mock("../study-time-repository", { spy: true });

const python = {
  id: "s-python",
  name: "Python",
  description: "Linguagem para backend",
  goalIds: ["g1"],
  createdAt: "2026-01-01T10:00:00.000Z",
};
const sql = {
  id: "s-sql",
  name: "SQL",
  goalIds: ["g1"],
  createdAt: "2026-01-02T10:00:00.000Z",
};

beforeEach(async () => {
  // Wednesday, 11/11/2026, local time.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 11, 10, 0));
  await db.table("subjects").bulkAdd([python, sql]);
});

afterEach(async () => {
  vi.useRealTimers();
  vi.mocked(putDailyStudyTime).mockReset();
  vi.mocked(listWeek).mockReset();
  await db.table("studyTime").clear();
  await db.table("subjects").clear();
});

function renderPage(path = `/subjects/${python.id}`) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/subjects" element={<p>Lista de disciplinas</p>} />
        <Route path="/subjects/:subjectId" element={<SubjectStudyTimePage />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

async function days() {
  const list = await screen.findByRole("list");
  return within(list).getAllByRole("listitem");
}

function day(label: RegExp) {
  return screen
    .getAllByRole("listitem")
    .find((item) => label.test(item.textContent ?? ""))!;
}

async function record(
  user: ReturnType<typeof userEvent.setup>,
  buttonName: string,
  hours: string,
  minutes: string,
) {
  await user.click(screen.getByRole("button", { name: buttonName }));
  const dialog = await screen.findByRole("dialog");
  await user.clear(within(dialog).getByLabelText("Horas"));
  await user.type(within(dialog).getByLabelText("Horas"), hours);
  await user.clear(within(dialog).getByLabelText("Minutos"));
  await user.type(within(dialog).getByLabelText("Minutos"), minutes);
  await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
  return dialog;
}

test("shows the subject and the current week, Monday to Sunday", async () => {
  renderPage();

  expect(
    await screen.findByRole("heading", { level: 1, name: "Python" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Linguagem para backend")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Disciplinas" })).toHaveAttribute(
    "href",
    "/subjects",
  );
  expect(screen.getByText("09/11 – 15/11/2026")).toBeInTheDocument();
  expect(screen.getByText("Semana atual")).toBeInTheDocument();

  const items = await days();
  expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
    "SEG 09/11",
    "TER 10/11",
    "QUA 11/11",
    "QUI 12/11",
    "SEX 13/11",
    "SÁB 14/11",
    "DOM 15/11",
  ]);
  expect(items[2]).toHaveAttribute("aria-current", "date");
  expect(items[2]).toHaveTextContent("Hoje");
  // Up to today: no record yet. After today: unavailable.
  expect(
    items.slice(0, 3).every((item) => /Sem registro/.test(item.textContent!)),
  ).toBe(true);
  expect(
    items.slice(3).every((item) => /Data futura/.test(item.textContent!)),
  ).toBe(true);
  expect(screen.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
});

test("records 01:30 for a day as 90 minutes", async () => {
  const user = renderPage();
  await days();

  await record(user, "Registrar tempo de terça-feira, 10/11/2026", "1", "30");

  expect(await screen.findByText("Tempo salvo.")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(day(/TER 10\/11/)).toHaveTextContent("01:30");
  expect(await db.table("studyTime").toArray()).toEqual([
    expect.objectContaining({
      subjectId: python.id,
      date: "2026-11-10",
      durationMinutes: 90,
    }),
  ]);
});

test("edits a day from 01:30 to 02:15 without adding a second record", async () => {
  await putDailyStudyTime(python.id, "2026-11-10", 90);
  const user = renderPage();
  await screen.findByText("01:30");

  await user.click(
    screen.getByRole("button", {
      name: "Editar tempo de terça-feira, 10/11/2026",
    }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByLabelText("Horas")).toHaveValue("1");
  expect(within(dialog).getByLabelText("Minutos")).toHaveValue("30");
  await user.clear(within(dialog).getByLabelText("Horas"));
  await user.type(within(dialog).getByLabelText("Horas"), "2");
  await user.clear(within(dialog).getByLabelText("Minutos"));
  await user.type(within(dialog).getByLabelText("Minutos"), "15");
  await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

  await waitFor(() => expect(day(/TER 10\/11/)).toHaveTextContent("02:15"));
  const stored = await db.table("studyTime").toArray();
  expect(stored).toHaveLength(1);
  expect(stored[0].durationMinutes).toBe(135);
});

test("removes a record after confirmation", async () => {
  await putDailyStudyTime(python.id, "2026-11-10", 90);
  const user = renderPage();
  await screen.findByText("01:30");

  await user.click(
    screen.getByRole("button", {
      name: "Editar tempo de terça-feira, 10/11/2026",
    }),
  );
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Remover registro",
    }),
  );
  const confirmation = await screen.findByRole("alertdialog", {
    name: "Remover registro?",
  });
  await user.click(
    within(confirmation).getByRole("button", { name: "Remover" }),
  );

  expect(await screen.findByText("Registro removido.")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(day(/TER 10\/11/)).toHaveTextContent("Sem registro");
  expect(await db.table("studyTime").count()).toBe(0);
});

test.each([
  ["", "", "Informe as horas (use 0 se não houver)."],
  ["1", "60", "Os minutos vão de 0 a 59."],
  ["-1", "0", "Use apenas números inteiros nas horas."],
  ["1.5", "0", "Use apenas números inteiros nas horas."],
  ["24", "0", "As horas vão de 0 a 23."],
  ["0", "0", "Informe um tempo maior que 00:00."],
])("rejects %j hours and %j minutes", async (hours, minutes, message) => {
  const user = renderPage();
  await days();

  await user.click(
    screen.getByRole("button", {
      name: "Registrar tempo de terça-feira, 10/11/2026",
    }),
  );
  const dialog = await screen.findByRole("dialog");
  if (hours) await user.type(within(dialog).getByLabelText("Horas"), hours);
  if (minutes)
    await user.type(within(dialog).getByLabelText("Minutos"), minutes);
  await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

  expect(await within(dialog).findByText(message)).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(await db.table("studyTime").count()).toBe(0);
});

test("reports a failure to save, keeping the typed values and the old total", async () => {
  await putDailyStudyTime(python.id, "2026-11-10", 90);
  const user = renderPage();
  await screen.findByText("01:30");
  vi.mocked(putDailyStudyTime).mockRejectedValueOnce(new Error("write failed"));

  const dialog = await record(
    user,
    "Editar tempo de terça-feira, 10/11/2026",
    "2",
    "15",
  );

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar o tempo. Tente novamente.",
  );
  expect(within(dialog).getByLabelText("Horas")).toHaveValue("2");
  expect(screen.queryByText("Tempo salvo.")).not.toBeInTheDocument();
  expect((await db.table("studyTime").toArray())[0].durationMinutes).toBe(90);
});

test("navigates to past weeks and back, never beyond the current week", async () => {
  const user = renderPage();
  await days();

  await user.click(screen.getByRole("button", { name: "Semana anterior" }));
  expect(await screen.findByText("02/11 – 08/11/2026")).toBeInTheDocument();
  expect(screen.queryByText("Semana atual")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Próxima semana" })).toBeEnabled();
  expect(
    screen
      .getAllByRole("listitem")
      .some((item) => item.hasAttribute("aria-current")),
  ).toBe(false);

  await user.click(screen.getByRole("button", { name: "Semana anterior" }));
  expect(await screen.findByText("26/10 – 01/11/2026")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Próxima semana" }));
  await user.click(screen.getByRole("button", { name: "Próxima semana" }));
  expect(await screen.findByText("09/11 – 15/11/2026")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
});

test("shows the current week when the URL asks for a future one", async () => {
  renderPage(`/subjects/${python.id}?week=2026-11-16`);

  expect(await screen.findByText("09/11 – 15/11/2026")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
});

test("shows a past week from the URL with its records only", async () => {
  await putDailyStudyTime(python.id, "2026-11-03", 45);
  await putDailyStudyTime(python.id, "2026-11-10", 90);
  renderPage(`/subjects/${python.id}?week=2026-11-02`);

  expect(await screen.findByText("02/11 – 08/11/2026")).toBeInTheDocument();
  expect(await screen.findByText("00:45")).toBeInTheDocument();
  expect(screen.queryByText("01:30")).not.toBeInTheDocument();
});

test("labels a week that crosses into a new year", async () => {
  vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
  renderPage();

  expect(
    await screen.findByText("29/12/2025 – 04/01/2026"),
  ).toBeInTheDocument();
  const items = await days();
  expect(items[0]).toHaveTextContent("SEG 29/12");
  expect(items[3]).toHaveTextContent("QUI 01/01");
  expect(items[3]).toHaveAttribute("aria-current", "date");
  expect(items[6]).toHaveTextContent("DOM 04/01");
});

test("keeps the records of each subject apart", async () => {
  await putDailyStudyTime(sql.id, "2026-11-10", 120);
  renderPage();
  await days();

  expect(screen.queryByText("02:00")).not.toBeInTheDocument();
  expect(day(/TER 10\/11/)).toHaveTextContent("Sem registro");
});

test("reports a subject that does not exist", async () => {
  renderPage("/subjects/s-unknown");

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Disciplina não encontrada",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Voltar para Disciplinas" }),
  ).toHaveAttribute("href", "/subjects");
});

test("reports a failure to load the week", async () => {
  vi.mocked(listWeek).mockRejectedValue(new Error("read failed"));
  renderPage();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar o tempo desta semana.",
  );
});

test("can record time with the keyboard only", async () => {
  const user = renderPage();
  await days();

  const button = screen.getByRole("button", {
    name: "Registrar tempo de segunda-feira, 09/11/2026",
  });
  button.focus();
  await user.keyboard("{Enter}");
  const dialog = await screen.findByRole("dialog");
  within(dialog).getByLabelText("Horas").focus();
  await user.keyboard("0");
  await user.tab();
  expect(within(dialog).getByLabelText("Minutos")).toHaveFocus();
  await user.keyboard("45{Enter}");

  expect(await screen.findByText("Tempo salvo.")).toBeInTheDocument();
  expect(day(/SEG 09\/11/)).toHaveTextContent("00:45");
  await waitFor(() =>
    expect(
      screen.getByRole("button", {
        name: "Editar tempo de segunda-feira, 09/11/2026",
      }),
    ).toHaveFocus(),
  );
});

test("shows the days after today as unavailable for recording", async () => {
  renderPage();
  const items = await days();

  // Wednesday is today: Monday to Wednesday can be recorded.
  for (const date of [
    "segunda-feira, 09/11/2026",
    "quarta-feira, 11/11/2026",
  ]) {
    expect(
      screen.getByRole("button", { name: `Registrar tempo de ${date}` }),
    ).toBeEnabled();
  }
  for (const date of [
    "quinta-feira, 12/11/2026",
    "sábado, 14/11/2026",
    "domingo, 15/11/2026",
  ]) {
    expect(
      screen.getByRole("button", {
        name: `Registro indisponível para ${date}, data futura`,
      }),
    ).toBeDisabled();
  }
  expect(items).toHaveLength(7);
  expect(items[3]).toHaveTextContent("Data futura");
});

test("blocks the days after today across a month change", async () => {
  // Monday, 30/11/2026: the rest of the week is in December.
  vi.setSystemTime(new Date(2026, 10, 30, 9, 0));
  renderPage();
  await days();

  expect(
    screen.getByRole("button", {
      name: "Registrar tempo de segunda-feira, 30/11/2026",
    }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", {
      name: "Registro indisponível para terça-feira, 01/12/2026, data futura",
    }),
  ).toBeDisabled();
});

test("blocks the days after today across a year change", async () => {
  // Thursday, 31/12/2026: Friday to Sunday are in 2027.
  vi.setSystemTime(new Date(2026, 11, 31, 9, 0));
  renderPage();
  await days();

  expect(
    screen.getByRole("button", {
      name: "Registrar tempo de quinta-feira, 31/12/2026",
    }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", {
      name: "Registro indisponível para sexta-feira, 01/01/2027, data futura",
    }),
  ).toBeDisabled();
});

test("keeps every day of a past week available", async () => {
  const user = renderPage();
  await days();

  await user.click(screen.getByRole("button", { name: "Semana anterior" }));
  await screen.findByText("02/11 – 08/11/2026");

  expect(screen.queryByText("Data futura")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: "Registrar tempo de domingo, 08/11/2026",
    }),
  ).toBeEnabled();
});
