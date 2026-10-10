import { expect, test } from "@playwright/test";

const emptyMessage =
  "Você ainda não tem objetivos. Crie o primeiro para começar.";

test("shows guidance when there are no goals", async ({ page }) => {
  await page.goto("/#/goals");

  await expect(
    page.getByRole("heading", { level: 1, name: "Objetivos" }),
  ).toBeVisible();
  await expect(page.getByText(emptyMessage)).toBeVisible();
});

test("creates a goal and keeps it after a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Objetivos" }).click();

  await page.getByLabel("Nome").fill("Aprender TypeScript");
  await page.getByLabel("Descrição (opcional)").fill("Tipos e generics");
  await page.getByRole("button", { name: "Criar objetivo" }).click();

  const goal = page.getByRole("listitem");
  await expect(page.getByRole("status")).toHaveText("Objetivo criado.");
  await expect(goal).toContainText("Aprender TypeScript");
  await expect(goal).toContainText("Tipos e generics");

  await page.reload();

  await expect(goal).toContainText("Aprender TypeScript");
  await expect(goal).toContainText("Tipos e generics");
  await expect(page.getByText(emptyMessage)).toBeHidden();
});

test("rejects a blank name", async ({ page }) => {
  await page.goto("/#/goals");

  await page.getByLabel("Nome").fill("   ");
  await page.getByRole("button", { name: "Criar objetivo" }).click();

  await expect(page.getByText("Informe o nome do objetivo.")).toBeVisible();
  await expect(page.getByText(emptyMessage)).toBeVisible();
});
