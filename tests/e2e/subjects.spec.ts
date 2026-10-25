import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function createGoal(page: Page, name: string) {
  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  await expect(page.getByRole("status")).toHaveText("Objetivo criado.");
}

test("creates a subject linked to two goals and keeps it after a page reload", async ({
  page,
}) => {
  await page.goto("/#/goals");
  await createGoal(page, "Desenvolvimento backend");
  await createGoal(page, "Certificação");

  await page.getByRole("link", { name: "Disciplinas" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Disciplinas" }),
  ).toBeVisible();
  await page.getByLabel("Nome").fill("Python");
  await page.getByLabel("Descrição (opcional)").fill("Linguagem");
  await page.getByRole("checkbox", { name: "Desenvolvimento backend" }).check();
  await page.getByRole("checkbox", { name: "Certificação" }).check();
  await page.getByRole("button", { name: "Criar disciplina" }).click();

  await expect(page.getByRole("status")).toHaveText("Disciplina criada.");
  const goals = page.getByRole("list", { name: "Objetivos vinculados" });
  await expect(goals.getByRole("listitem")).toHaveText([
    "Desenvolvimento backend",
    "Certificação",
  ]);

  await page.reload();

  await expect(page.getByText("Python", { exact: true })).toBeVisible();
  await expect(page.getByText("Linguagem")).toBeVisible();
  await expect(goals.getByRole("listitem")).toHaveText([
    "Desenvolvimento backend",
    "Certificação",
  ]);
});

test("guides the user to create a goal when there are none", async ({
  page,
}) => {
  await page.goto("/#/subjects");

  await expect(
    page.getByText(/Cadastre um objetivo antes de criar uma disciplina/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ir para Objetivos" }).click();

  await expect(page).toHaveURL(/#\/goals$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Objetivos" }),
  ).toBeVisible();
});
