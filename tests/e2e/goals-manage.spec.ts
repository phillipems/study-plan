import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const emptyMessage =
  "Você ainda não tem objetivos. Crie o primeiro para começar.";

async function createGoal(page: Page, name: string, description = "") {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição (opcional)").fill(description);
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  await expect(page.getByRole("status")).toHaveText("Objetivo criado.");
}

test("edits a goal and keeps the change after a page reload", async ({
  page,
}) => {
  await page.goto("/#/goals");
  await createGoal(page, "Inglês", "Leitura técnica");

  await page.getByRole("button", { name: 'Ações para "Inglês"' }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar objetivo" });
  await dialog.getByLabel("Nome").fill("Inglês técnico");
  await dialog.getByLabel("Descrição (opcional)").fill("Documentação");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Objetivo atualizado.")).toBeVisible();
  const goal = page.getByRole("listitem");
  await expect(goal).toContainText("Inglês técnico");
  await expect(goal).toContainText("Documentação");

  await page.reload();

  await expect(goal).toContainText("Inglês técnico");
  await expect(goal).toContainText("Documentação");
});

test("deletes a goal and keeps it deleted after a page reload", async ({
  page,
}) => {
  await page.goto("/#/goals");
  await createGoal(page, "Física");

  await page.getByRole("button", { name: 'Ações para "Física"' }).click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Excluir objetivo?" });
  await expect(dialog).toContainText("Física");
  await dialog.getByRole("button", { name: "Excluir" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Objetivo excluído.")).toBeVisible();
  await expect(page.getByText(emptyMessage)).toBeVisible();

  await page.reload();

  await expect(page.getByText(emptyMessage)).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(0);
});
