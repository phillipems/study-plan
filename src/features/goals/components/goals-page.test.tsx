import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import type { Goal } from "../goal";
import { addGoal, deleteGoal, listGoals, updateGoal } from "../goal-repository";
import { GoalsPage } from "./goals-page";

// Keeps the real repository, but lets a test force a persistence failure.
vi.mock("../goal-repository", { spy: true });

afterEach(async () => {
  vi.mocked(addGoal).mockReset();
  vi.mocked(listGoals).mockReset();
  vi.mocked(updateGoal).mockReset();
  vi.mocked(deleteGoal).mockReset();
  await db.table("goals").clear();
});

const emptyMessage =
  "Você ainda não tem objetivos. Crie o primeiro para começar.";

async function renderLoadedPage() {
  render(<GoalsPage />);
  await screen.findByText(emptyMessage);
  return userEvent.setup();
}

function submit(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: "Criar objetivo" }));
}

test("shows guidance when there are no goals", async () => {
  render(<GoalsPage />);

  expect(await screen.findByText(emptyMessage)).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

test("creates a goal with a description and lists it", async () => {
  const user = await renderLoadedPage();

  await user.type(screen.getByLabelText("Nome"), "Aprender TypeScript");
  await user.type(
    screen.getByLabelText("Descrição (opcional)"),
    "Tipos e generics",
  );
  await submit(user);

  const item = await screen.findByRole("listitem");
  expect(within(item).getByText("Aprender TypeScript")).toBeInTheDocument();
  expect(within(item).getByText("Tipos e generics")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Objetivo criado.");
  expect(screen.queryByText(emptyMessage)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Nome")).toHaveValue("");
  expect(screen.getByLabelText("Descrição (opcional)")).toHaveValue("");
});

test("creates a goal without a description", async () => {
  const user = await renderLoadedPage();

  await user.type(screen.getByLabelText("Nome"), "Inglês");
  await submit(user);

  expect(await screen.findByRole("listitem")).toHaveTextContent(/^Inglês$/);
});

test("rejects a name made only of spaces", async () => {
  const user = await renderLoadedPage();

  await user.type(screen.getByLabelText("Nome"), "   ");
  await submit(user);

  expect(
    await screen.findByText("Informe o nome do objetivo."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Nome")).toBeInvalid();
  expect(screen.getByLabelText("Nome")).toHaveFocus();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByText(emptyMessage)).toBeInTheDocument();
});

test("rejects a name and a description above the length limits", async () => {
  const user = await renderLoadedPage();

  await user.click(screen.getByLabelText("Nome"));
  await user.paste("a".repeat(101));
  await user.click(screen.getByLabelText("Descrição (opcional)"));
  await user.paste("a".repeat(501));
  await submit(user);

  expect(
    await screen.findByText("O nome deve ter no máximo 100 caracteres."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("A descrição deve ter no máximo 500 caracteres."),
  ).toBeInTheDocument();
  expect(screen.getByText(emptyMessage)).toBeInTheDocument();
});

test("reports a failure to save without announcing success", async () => {
  const user = await renderLoadedPage();
  vi.mocked(addGoal).mockRejectedValueOnce(new Error("write failed"));

  await user.type(screen.getByLabelText("Nome"), "Química");
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar o objetivo. Tente novamente.",
  );
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByLabelText("Nome")).toHaveValue("Química");
  expect(screen.getByText(emptyMessage)).toBeInTheDocument();
});

test("reports a failure to load the goals", async () => {
  vi.mocked(listGoals).mockRejectedValue(new Error("read failed"));

  render(<GoalsPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível carregar os objetivos.",
  );
  expect(screen.getByRole("button", { name: "Criar objetivo" })).toBeEnabled();
});

const english: Goal = {
  id: "goal-english",
  name: "Inglês",
  description: "Leitura técnica",
  createdAt: "2026-01-01T10:00:00.000Z",
};

const physics: Goal = {
  id: "goal-physics",
  name: "Física",
  createdAt: "2026-01-02T10:00:00.000Z",
};

async function renderWithGoals() {
  await addGoal(english);
  await addGoal(physics);
  render(<GoalsPage />);
  await screen.findAllByRole("listitem");
  return userEvent.setup();
}

async function chooseAction(
  user: ReturnType<typeof userEvent.setup>,
  goalName: string,
  action: "Editar" | "Excluir",
) {
  await user.click(
    screen.getByRole("button", { name: `Ações para "${goalName}"` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: action }));
}

// hidden: an open dialog marks the rest of the page as aria-hidden.
function cardNames() {
  return screen
    .getAllByRole("listitem", { hidden: true })
    .map((item) => item.querySelector("p")?.textContent);
}

test("opens the edit dialog with the current name and description", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Editar");

  const dialog = await screen.findByRole("dialog", { name: "Editar objetivo" });
  expect(within(dialog).getByLabelText("Nome")).toHaveValue("Inglês");
  expect(within(dialog).getByLabelText("Descrição (opcional)")).toHaveValue(
    "Leitura técnica",
  );
});

test("saves the changes and keeps the goal in its position", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Editar");
  const dialog = await screen.findByRole("dialog");
  await user.clear(within(dialog).getByLabelText("Nome"));
  await user.type(within(dialog).getByLabelText("Nome"), "Inglês técnico");
  await user.clear(within(dialog).getByLabelText("Descrição (opcional)"));
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alterações" }),
  );

  expect(await screen.findByText("Objetivo atualizado.")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(cardNames()).toEqual(["Física", "Inglês técnico"]);
  expect(screen.queryByText("Leitura técnica")).not.toBeInTheDocument();
});

test("does not save a blank name", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Editar");
  const dialog = await screen.findByRole("dialog");
  await user.clear(within(dialog).getByLabelText("Nome"));
  await user.type(within(dialog).getByLabelText("Nome"), "   ");
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alterações" }),
  );

  expect(
    await within(dialog).findByText("Informe o nome do objetivo."),
  ).toBeInTheDocument();
  expect(within(dialog).getByLabelText("Nome")).toHaveFocus();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(await listGoals()).toEqual([physics, english]);
});

test("discards the changes when the edit is cancelled", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Editar");
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Nome"), " alterado");
  await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(cardNames()).toEqual(["Física", "Inglês"]);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: 'Ações para "Inglês"' }),
    ).toHaveFocus(),
  );
  expect(await listGoals()).toEqual([physics, english]);

  await chooseAction(user, "Inglês", "Editar");
  expect(
    within(await screen.findByRole("dialog")).getByLabelText("Nome"),
  ).toHaveValue("Inglês");
});

test("deletes a goal after confirmation", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Excluir");
  const dialog = await screen.findByRole("alertdialog", {
    name: "Excluir objetivo?",
  });
  expect(dialog).toHaveTextContent("Inglês");
  expect(dialog).toHaveTextContent("Esta ação não pode ser desfeita.");
  await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

  expect(await screen.findByText("Objetivo excluído.")).toBeInTheDocument();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(cardNames()).toEqual(["Física"]);
  expect(await listGoals()).toEqual([physics]);
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Seus objetivos" }),
    ).toHaveFocus(),
  );
});

test("keeps the goal when the deletion is cancelled", async () => {
  const user = await renderWithGoals();

  await chooseAction(user, "Inglês", "Excluir");
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(cardNames()).toEqual(["Física", "Inglês"]);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: 'Ações para "Inglês"' }),
    ).toHaveFocus(),
  );
  expect(await listGoals()).toEqual([physics, english]);
});

test("reports a failure to save the changes without announcing success", async () => {
  const user = await renderWithGoals();
  vi.mocked(updateGoal).mockRejectedValueOnce(new Error("write failed"));

  await chooseAction(user, "Inglês", "Editar");
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Nome"), " técnico");
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alterações" }),
  );

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar as alterações. Tente novamente.",
  );
  expect(within(dialog).getByLabelText("Nome")).toHaveValue("Inglês técnico");
  expect(screen.queryByText("Objetivo atualizado.")).not.toBeInTheDocument();
  expect(await listGoals()).toEqual([physics, english]);
});

test("reports a failure to delete without announcing success", async () => {
  const user = await renderWithGoals();
  vi.mocked(deleteGoal).mockRejectedValueOnce(new Error("write failed"));

  await chooseAction(user, "Inglês", "Excluir");
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Não foi possível excluir o objetivo. Tente novamente.",
  );
  expect(screen.queryByText("Objetivo excluído.")).not.toBeInTheDocument();
  expect(cardNames()).toEqual(["Física", "Inglês"]);
});
