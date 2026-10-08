import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { db } from "@/infrastructure/database/database";
import { addGoal, listGoals } from "../goal-repository";
import { GoalsPage } from "./goals-page";

// Keeps the real repository, but lets a test force a persistence failure.
vi.mock("../goal-repository", { spy: true });

afterEach(async () => {
  vi.mocked(addGoal).mockReset();
  vi.mocked(listGoals).mockReset();
  await db.table("goals").clear();
});

const emptyMessage = "Você ainda não tem objetivos. Crie o primeiro acima.";

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
