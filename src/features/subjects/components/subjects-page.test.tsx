import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { addSubjectWithGoals, listSubjects } from "../subject-repository";
import { SubjectsPage } from "./subjects-page";

// Keeps the real repository, but lets a test force a persistence failure.
vi.mock("../subject-repository", { spy: true });

afterEach(async () => {
  vi.mocked(addSubjectWithGoals).mockReset();
  vi.mocked(listSubjects).mockReset();
  await db.table("subjects").clear();
  await db.table("goals").clear();
});

const backend = {
  id: "g-backend",
  name: "Desenvolvimento backend",
  createdAt: "2026-01-01T10:00:00.000Z",
};
const certification = {
  id: "g-cert",
  name: "Certificação",
  createdAt: "2026-01-02T10:00:00.000Z",
};
const emptyMessage =
  "Você ainda não tem disciplinas. Crie a primeira para começar.";

function renderPage() {
  render(
    <MemoryRouter>
      <SubjectsPage />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

async function renderWithGoals() {
  await db.table("goals").bulkAdd([backend, certification]);
  const user = renderPage();
  await screen.findByRole("checkbox", { name: backend.name });
  return user;
}

function submit(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: "Criar disciplina" }));
}

test("guides the user to create a goal first when there are none", async () => {
  renderPage();

  expect(
    await screen.findByText(
      /Cadastre um objetivo antes de criar uma disciplina/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Ir para Objetivos" }),
  ).toHaveAttribute("href", "/goals");
  expect(
    screen.queryByRole("button", { name: "Criar disciplina" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(emptyMessage)).toBeInTheDocument();
});

test("creates a subject linked to two goals and lists it", async () => {
  const user = await renderWithGoals();

  await user.type(screen.getByLabelText("Nome"), "Python");
  await user.type(screen.getByLabelText("Descrição (opcional)"), "Linguagem");
  await user.click(screen.getByRole("checkbox", { name: backend.name }));
  await user.click(screen.getByRole("checkbox", { name: certification.name }));
  expect(screen.getByText("2 objetivos selecionados")).toBeInTheDocument();
  await submit(user);

  // The status region exists from the start; wait for its message.
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Disciplina criada."),
  );
  // Goals are offered most recent first, like on the goals page.
  const card = (await screen.findByText("Python")).closest("li")!;
  expect(within(card).getByText("Python")).toBeInTheDocument();
  expect(within(card).getByText("Linguagem")).toBeInTheDocument();
  const goals = within(card).getByRole("list", {
    name: "Objetivos vinculados",
  });
  expect(
    within(goals)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([backend.name, certification.name]);
  expect(screen.getByLabelText("Nome")).toHaveValue("");
  expect(
    screen.getByRole("checkbox", { name: backend.name }),
  ).not.toBeChecked();
  expect(await listSubjects()).toHaveLength(1);
});

test("rejects a blank name", async () => {
  const user = await renderWithGoals();

  await user.type(screen.getByLabelText("Nome"), "   ");
  await user.click(screen.getByRole("checkbox", { name: backend.name }));
  await submit(user);

  expect(
    await screen.findByText("Informe o nome da disciplina."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Nome")).toHaveFocus();
  expect(await listSubjects()).toEqual([]);
});

test("requires at least one linked goal", async () => {
  const user = await renderWithGoals();

  await user.type(screen.getByLabelText("Nome"), "Python");
  await submit(user);

  expect(
    await screen.findByText("Selecione ao menos um objetivo."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("checkbox", { name: certification.name }),
  ).toHaveFocus();
  expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  expect(await listSubjects()).toEqual([]);
});

test("reports a failure to save without announcing success", async () => {
  const user = await renderWithGoals();
  vi.mocked(addSubjectWithGoals).mockRejectedValueOnce(
    new Error("write failed"),
  );

  await user.type(screen.getByLabelText("Nome"), "Python");
  await user.click(screen.getByRole("checkbox", { name: certification.name }));
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar a disciplina. Tente novamente.",
  );
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByLabelText("Nome")).toHaveValue("Python");
  expect(
    screen.getByRole("checkbox", { name: certification.name }),
  ).toBeChecked();
  expect(await listSubjects()).toEqual([]);
});

test("can be completed with the keyboard only", async () => {
  const user = await renderWithGoals();

  screen.getByLabelText("Nome").focus();
  await user.keyboard("SQL");
  await user.tab();
  await user.keyboard("Consultas");
  await user.tab();
  expect(
    screen.getByRole("checkbox", { name: certification.name }),
  ).toHaveFocus();
  await user.keyboard(" ");
  await user.tab();
  await user.keyboard(" ");
  await user.tab();
  expect(
    screen.getByRole("button", { name: "Criar disciplina" }),
  ).toHaveFocus();
  await user.keyboard("{Enter}");

  // The status region exists from the start; wait for its message.
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Disciplina criada."),
  );
  const [subject] = await listSubjects();
  expect(subject).toMatchObject({
    name: "SQL",
    description: "Consultas",
    goalIds: [certification.id, backend.id],
  });
});

test("shows only the goals that still exist on a card", async () => {
  await db.table("goals").bulkAdd([backend]);
  await db.table("subjects").add({
    id: "s1",
    name: "Python",
    goalIds: [backend.id, "g-deleted"],
    createdAt: "2026-02-01T10:00:00.000Z",
  });
  renderPage();

  const goals = await screen.findByRole("list", {
    name: "Objetivos vinculados",
  });
  expect(within(goals).getAllByRole("listitem")).toHaveLength(1);
  expect(goals).toHaveTextContent(backend.name);
});

test("reports a failure to load the subjects", async () => {
  vi.mocked(listSubjects).mockRejectedValue(new Error("read failed"));

  renderPage();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar as disciplinas.",
  );
});
